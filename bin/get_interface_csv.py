#!/opt/zenoss/bin/python
#
# Utilized Python to export a list of device/interfaces from the 
#
import Globals, re, sys, Acquisition
from Products.ZenUtils.ZenScriptBase import ZenScriptBase
from transaction import commit

dmd = ZenScriptBase(connect=True).dmd

for dev in dmd.Devices.getSubDevices():

    for int in dev.os.interfaces():
        type = '32bit';
        if re.search("_64", str(int.type)) :
            type = '64bit'

        print '"'+ dev.id + '","' + int.id + '","' + int.description + '","' + str(int.operStatus) + '","' + dev.title + '","' + type + '"'
