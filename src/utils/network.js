const os = require("os");

function getLocalIP() {
    const interfaces = os.networkInterfaces();
    const candidates = [];

    for (const name in interfaces) {
        for (const iface of interfaces[name]) {
            if (
                iface.family === "IPv4" &&
                !iface.internal
            ) {
                candidates.push({
                    name,
                    address: iface.address
                });
            }
        }
    }

    const filtered = candidates.filter(item =>
        item.address !== "192.168.137.1"
    );

    const wifi = filtered.find(item =>
        item.name.toLowerCase().includes("wi-fi") ||
        item.name.toLowerCase().includes("wireless")
    );

    if (wifi) return wifi.address;

    const lan = filtered.find(item =>
        item.address.startsWith("192.168.") ||
        item.address.startsWith("172.") ||
        item.address.startsWith("10.")
    );

    if (lan) return lan.address;

    return "127.0.0.1";
}

function isLocalRequest(req) {
    const ip =
        req.ip ||
        req.connection.remoteAddress ||
        "";

    return (
        ip === "127.0.0.1" ||
        ip === "::1" ||
        ip === "::ffff:127.0.0.1"
    );
}

module.exports = {
    getLocalIP,
    isLocalRequest
};