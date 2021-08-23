import asyncio
import sys

import busio
import RPi.GPIO as GPIO
from board import SCL, SDA
from adafruit_pca9685 import PCA9685

from control import Wheels, Arm, Light, Speech, Joystick


class Routine:
    def __init__(self, robot):
        self.action_queue = []
        self.sync_level = 0
        self.sync_queue = []
        self.on_started = []
        self.robot = robot

    def enqueue(self, action):
        if self.sync_level > 0:
            self.sync_queue.append(action)
        else:
            self.action_queue.append(action)

    def enqueue_synced(self):
        self.enqueue(asyncio.wait(set(self.sync_queue)))
        self.sync_queue = []

    async def flush_queue(self):
        for coro in self.action_queue:
            await coro
        self.action_queue = []

    def in_sync(self):
        routine = self
        class SyncTracker:
            def __enter__(self):
                routine.sync_level += 1
            def __exit__(self, type, value, traceback):
                routine.sync_level -= 1
                if routine.sync_level == 0:
                    routine.enqueue_synced()
        return SyncTracker()

    def wait(self, secs):
        self.enqueue(asyncio.sleep(secs))

    def say(self, message):
        self.enqueue(self.robot.speech.synthesize(message))

    def set_antenna_state(self, side, state):
        if side == 'both':
            with self.in_sync():
                self.set_antenna_state('left', state)
                self.set_antenna_state('right', state)
            return
        elif side == 'left':
            antenna = self.robot.left_antenna
        elif side == 'right':
            antenna = self.robot.right_antenna
        else:
            raise NameError('No such antenna: ' + side)

        if state == 'on':
            value = GPIO.HIGH
        elif state == 'off':
            value = GPIO.LOW
        else:
            raise NameError('No such antenna state: ' + state)

        async def set_antenna_state_async():
            antenna.set(value)
        self.enqueue(set_antenna_state_async())

    def set_eye_state(self, side, state):
        if side == 'both':
            with self.in_sync():
                self.set_eye_state('left', state)
                self.set_eye_state('right', state)
            return
        elif side == 'left':
            eye = self.robot.left_eye
        elif side == 'right':
            eye = self.robot.right_eye
        else:
            raise NameError('No such eye: ' + side)

        if state == 'on':
            value = GPIO.HIGH
        elif state == 'off':
            value = GPIO.LOW
        else:
            raise NameError('No such eye state: ' + state)

        async def set_eye_state_async():
            eye.set(value)
        self.enqueue(set_eye_state_async())

    def move_arm(self, side, angle):
        if side == 'both':
            with self.in_sync():
                self.move_arm('left', angle)
                self.move_arm('right', angle)
            return
        elif side == 'left':
            arm = self.robot.left_arm
        elif side == 'right':
            arm = self.robot.right_arm
        else:
            raise NameError('No such arm: ' + side)
        
        async def move_arm_async():
            arm.move(angle)
            await asyncio.sleep(0.5)
        self.enqueue(move_arm_async())

    def when_started(self, f):
        async def event_function():
            f()
            await self.flush_queue()
        self.on_started.append(event_function)
        return event_function

    async def start(self):
        await self.flush_queue()
        for f in self.on_started:
            await f()


class Robot:
    def __init__(self, loop):
        # Set up GPIO for BCM pin number references
        GPIO.setmode(GPIO.BCM)

        # Initialize the PCA9685 servo controller
        pca = PCA9685(busio.I2C(SCL, SDA))
        pca.frequency = 60

        # Wheels
        self.wheels = Wheels(pca, [0, 1, 2, 3])

        # Arms
        self.left_arm = Arm(pca, 4, lambda t: 90 - t)
        self.right_arm = Arm(pca, 5, lambda t: 90 + t - 10)
        self.left_arm.move(0)
        self.right_arm.move(0)

        # Lights
        self.left_antenna = Light(26)
        self.right_antenna = Light(13)
        self.left_eye = Light(6)
        self.right_eye = Light(19)

        # Joystick
        self.joystick = Joystick()
        self.joystick.register(loop)
        self.joystick.add_button_callback('start', self.start_button)
        self.joystick.add_axis_callback('x', self.joystick_locomote)
        self.joystick.add_axis_callback('y', self.joystick_locomote)

        # Speech
        self.speech = Speech('/home/pi/.google-key')

        self.routine = None

        self.active_actions = []

    def start_button(self, joystick, button, state):
        self.stop()

    def joystick_locomote(self, joystick, axis, state):
        # Ignore joystick axis inputs when a routine is active
        if self.routine:
            return

        x_vector, y_vector = -joystick.axis_states['x'], -joystick.axis_states['y']

        # Motor solutions taken from: http://home.kendra.com/mauser/joystick.html
        v = y_vector * (2 - abs(x_vector))
        w = x_vector * (2 - abs(y_vector))
        L = (v - w) / 2.0
        R = (v + w) / 2.0
        self.wheels.go(L, R)

    def stop(self):
        self.routine = None
        for action in self.active_actions:
            action.cancel()

    async def handle_connection(self, reader, writer):
        recv = await reader.readline()
        command = recv.decode().strip()
        if command in ('RUN', 'STOP'):
            await getattr(self, 'handle_' + command)(reader, writer)
        else:
            writer.write('ERROR;No such command'.encode())
            await writer.drain()
            writer.close()
            await writer.wait_closed()

    async def handle_RUN(self, reader, writer):
        recv = await reader.readline()
        size = int(recv.decode().strip())

        recv = await reader.read(size)
        code = recv.decode()

        self.routine = Routine(self)
        try:
            exec(code, {'robot': self.routine})
        except Exception as e:
            writer.write(('ERROR;' + str(e)).encode())
            self.routine = None
        else:
            self.enqueue_action(self.routine.start())
            writer.write('OK'.encode())
            await writer.drain()
        writer.close()
        await writer.wait_closed()

    async def handle_STOP(self, reader, writer):
        self.stop()
        writer.write('OK'.encode())
        await writer.drain()
        writer.close()
        await writer.wait_closed()

    def enqueue_action(self, coro):
        action = asyncio.create_task(coro)
        self.active_actions.append(action)
        action.add_done_callback(self.remove_action)

    def remove_action(self, action):
        if action in self.active_actions:
            self.active_actions.remove(action)


async def main():
    loop = asyncio.get_event_loop()
    robot = Robot(loop)

    if len(sys.argv) > 1 and sys.argv[1] == 'test_program':
        import test
        asyncio.create_task(test.client_run_command())

    server = await asyncio.start_unix_server(robot.handle_connection, '/tmp/robot-control')
    async with server:
        await server.serve_forever()


if __name__ == '__main__':
    asyncio.run(main())
