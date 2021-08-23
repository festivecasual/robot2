import asyncio


program = """
@robot.when_started
def started():
    robot.say("Let's get started.")
    robot.set_antenna_state('both', 'on')
    robot.set_eye_state('both', 'on')
    robot.wait(1)
    robot.move_arm('both', 90)
    robot.wait(1)
    with robot.in_sync():
        robot.say('This is my left side.')
        robot.set_antenna_state('left', 'off')
        robot.set_eye_state('left', 'off')
        robot.move_arm('left', -90)
    robot.wait(1)
    with robot.in_sync():
        robot.say('This is my right side.')
        robot.set_antenna_state('right', 'off')
        robot.set_eye_state('right', 'off')
        robot.move_arm('right', -90)
    robot.wait(2)
    robot.say('All done!')
"""


async def client_run_command():
    await asyncio.sleep(1)

    reader, writer = await asyncio.open_unix_connection('/tmp/robot-control')
    
    payload = program.encode()
    header = ('RUN\n' + str(len(payload)) + '\n').encode()
    writer.write(header)
    writer.write(payload)
    await writer.drain()
    
    recv = await reader.read()
    reply = recv.decode()
    print('Reply from RUN command:', reply)
    
    writer.close()
    await writer.wait_closed()


async def client_stop_command():
    await asyncio.sleep(5)

    reader, writer = await asyncio.open_unix_connection('/tmp/robot-control')
    
    payload = program.encode()
    header = ('STOP\n').encode()
    writer.write(header)
    await writer.drain()
    
    recv = await reader.read()
    reply = recv.decode()
    print('Reply from STOP command:', reply)
    
    writer.close()
    await writer.wait_closed()
