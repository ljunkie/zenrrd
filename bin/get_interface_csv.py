#!/opt/zenoss/bin/python
#
# Utilized Python to export a list of device/interfaces from the
#
import Globals, re, sys, Acquisition
from Products.ZenUtils.ZenScriptBase import ZenScriptBase
from transaction import commit

from pprint import pprint
from inspect import getmembers
dmd = ZenScriptBase(connect=True).dmd

for dev in dmd.Devices.getSubDevices():
    #dev = dmd.Devices.findDevice('real device name') ## debug
    #pprint(dump(dev))
    for int in dev.os.interfaces():
        # pprint(getmembers(int))
        type = '32bit'; ## default to 32bit
        template = dev.getRRDTemplateByName(int.type)
        if template: # some don't have templates
            for ds in template.getRRDDataSources():
                if re.search("ifHC", str(ds.id)) :
                    type = '64bit'
                    #break
        else: # for ints without their own template.. it probably defaulted back to <type> or <type>_64
            if re.search("_64", str(int.type)) :
                type = '64bit'            
        print '"'+ dev.id + '","' + int.id + '","' + int.description + '","' + str(int.operStatus) + '","' + dev.title + '","' + type + '","' + int.type + '"'



