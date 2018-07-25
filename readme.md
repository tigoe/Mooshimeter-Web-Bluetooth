# Mooshimeter Browser Interface using Web-Bluetooth

This is a project to create a minimal browser-based interface for the [Mooshimeter](https://moosh.im/mooshimeter/). It's based on a few initial sources: Yining Shi's [simplified Web-Bluetooth example](https://github.com/yining1023/arduino101CuriePME) and DJ O'Connor's [Web-bluetooth Mooshimeter](https://bitbucket.org/DJOConnor/mooshiweb) example. It's currently a messy, Frankensteinian hybrod of the two.

The goal of this project is to remove whatever dependencies can be removed from those two projects to make this as widely usable as possible. Specifically, we want to make a web interface for the mooshimeter that is accessible to low-vision users. 

Presumably one could re-use the mooshimeter.js code in node.js as well, though that is not the goal of this project.  

## Other useful Mooshimeter references:

* [The Mooshimeter FAQ](https://moosh.im/faq/)
* [The Mooshimeter Manual](https://moosh.im/s/manual/MooshimeterManualRev1.pdf)
* [Mooshimeter Cheat Sheet](https://moosh.im/wp-content/uploads/2015/01/MooshimeterCheatSheet-V0.pdf)
* [The Mooshimeter Bluetooth LE Serial Protocol Description](https://moosh.im/wiki/index.php/BLE_Serial_Protocol_Description) - complex and a little impenetrable to the non-engineer, but the info about the API is all there.
* [Mooshimeter Python API](https://github.com/mooshim/Mooshimeter-PythonAPI)
* [Mooshimeter for BlueGiga BLE113 SOC](https://github.com/tessel/ble-ble113a)  - **Un-maintained** designed for the [Tessel](https://tessel.io/)   boards. Tessel sold to Seeedstudio, so it's not clear whether they're still in production.
* [Stripped down Mooshimeter example](https://gist.github.com/johnnyman727/9466655) based on the Tessel example
