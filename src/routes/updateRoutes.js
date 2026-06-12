const express = require("express");

const {
    runUpdate
} = require("../updateService");

const router = express.Router();

router.post("/update-now", (req, res) => {
    const io = req.app.get("io");

    io.emit("serverUpdating");

    res.json({
        ok: true
    });

    setTimeout(() => {
        runUpdate();
    }, 1000);
});

module.exports = router;