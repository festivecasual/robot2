import sys

import busio
import RPi.GPIO as GPIO
from board import SCL, SDA
from adafruit_pca9685 import PCA9685

from control import Wheels, Arm, Light


# Set up GPIO for BCM pin number references
GPIO.setmode(GPIO.BCM)

# Initialize the PCA9685 servo controller
pca = PCA9685(busio.I2C(SCL, SDA))
pca.frequency = 60

# Wheels
wheels = Wheels(pca)

# Arms
left_arm = Arm(pca, 4, lambda t: 180 - t)
right_arm = Arm(pca, 5)

# Lights
left_antenna = Light(26)
right_antenna = Light(13)
left_eye = Light(6)
right_eye = Light(19)

input()

left_arm.move(90)
right_arm.move(180)
input()
left_arm.move(180)
right_arm.move(90)
input()
left_arm.move(0)
right_arm.move(0)
input()

left_antenna.on()
right_antenna.on()
left_eye.on()
right_eye.on()
input()

wheels.go()
input()
wheels.stop()
input()
wheels.go(-1)
input()
wheels.stop()
input()

left_antenna.off()
right_antenna.off()
left_eye.off()
right_eye.off()
