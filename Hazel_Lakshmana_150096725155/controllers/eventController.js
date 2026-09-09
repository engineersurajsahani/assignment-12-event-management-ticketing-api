const { db } = require("../config/firebaseConfig");

const out = (id, d) => ({
    id,
    ...d
});

exports.listEvents = async (req, res) => {
    try {
        const snap = await db
            .collection("events")
            .where("eventDate", ">=", new Date().toISOString())
            .orderBy("eventDate", "asc")
            .get();

        let a = snap.docs.map((x) => out(x.id, x.data()));

        const { category, city } = req.query;

        if (category) {
            a = a.filter(
                (x) => x.category?.toLowerCase() === category.toLowerCase()
            );
        }

        if (city) {
            a = a.filter(
                (x) => x.city?.toLowerCase() === city.toLowerCase()
            );
        }

        res.json({
            success: true,
            count: a.length,
            data: a
        });
    } catch (e) {
        console.error(e);

        res.status(500).json({
            success: false,
            message: "Could not load events."
        });
    }
};

exports.getEvent = async (req, res) => {
    try {
        const d = await db
            .collection("events")
            .doc(req.params.id)
            .get();

        if (!d.exists) {
            return res.status(404).json({
                success: false,
                message: "Event not found."
            });
        }

        res.json({
            success: true,
            data: out(d.id, d.data())
        });
    } catch (e) {
        res.status(500).json({
            success: false,
            message: "Could not load event."
        });
    }
};

exports.createEvent = async (req, res) => {
    try {
        const {
            title,
            description = "",
            category,
            eventDate,
            venue,
            city,
            ticketPrice,
            totalCapacity
        } = req.body;

        if (
            !title ||
            !category ||
            !eventDate ||
            !venue ||
            !city ||
            ticketPrice === undefined ||
            totalCapacity === undefined
        ) {
            return res.status(400).json({
                success: false,
                message: "All event fields are required."
            });
        }

        const date = new Date(eventDate);
        const price = Number(ticketPrice);
        const cap = Number(totalCapacity);

        if (Number.isNaN(date.getTime()) || date <= new Date()) {
            return res.status(400).json({
                success: false,
                message: "eventDate must be a valid future date."
            });
        }

        if (
            !Number.isFinite(price) ||
            price < 0 ||
            !Number.isInteger(cap) ||
            cap <= 0
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid ticketPrice or totalCapacity."
            });
        }

        const ref = db.collection("events").doc();

        const event = {
            id: ref.id,
            title: title.trim(),
            description: description.trim(),
            category: category.trim(),
            eventDate: date.toISOString(),
            venue: venue.trim(),
            city: city.trim(),
            organizerId: req.user.id,
            ticketPrice: price,
            totalCapacity: cap,
            availableTickets: cap,
            createdAt: new Date().toISOString()
        };

        await ref.set(event);

        res.status(201).json({
            success: true,
            message: "Event created successfully.",
            data: event
        });
    } catch (e) {
        console.error(e);

        res.status(500).json({
            success: false,
            message: "Could not create event."
        });
    }
};

exports.updateEvent = async (req, res) => {
    try {
        const ref = db
            .collection("events")
            .doc(req.params.id);

        const d = await ref.get();

        if (!d.exists) {
            return res.status(404).json({
                success: false,
                message: "Event not found."
            });
        }

        if (d.data().organizerId !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: "You can only update your own events."
            });
        }

        const allowed = [
            "title",
            "description",
            "category",
            "eventDate",
            "venue",
            "city",
            "ticketPrice"
        ];

        const u = {};

        allowed.forEach((k) => {
            if (req.body[k] !== undefined) {
                u[k] = req.body[k];
            }
        });

        if (u.eventDate) {
            const date = new Date(u.eventDate);

            if (
                Number.isNaN(date.getTime()) ||
                date <= new Date()
            ) {
                return res.status(400).json({
                    success: false,
                    message: "eventDate must be future."
                });
            }

            u.eventDate = date.toISOString();
        }

        if (u.ticketPrice !== undefined) {
            u.ticketPrice = Number(u.ticketPrice);

            if (
                !Number.isFinite(u.ticketPrice) ||
                u.ticketPrice < 0
            ) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid ticketPrice."
                });
            }
        }

        if (!Object.keys(u).length) {
            return res.status(400).json({
                success: false,
                message: "No valid fields provided."
            });
        }

        await ref.update(u);

        const n = await ref.get();

        res.json({
            success: true,
            message: "Event updated successfully.",
            data: out(n.id, n.data())
        });
    } catch (e) {
        console.error(e);

        res.status(500).json({
            success: false,
            message: "Could not update event."
        });
    }
};

exports.deleteEvent = async (req, res) => {
    try {
        const ref = db
            .collection("events")
            .doc(req.params.id);

        const d = await ref.get();

        if (!d.exists) {
            return res.status(404).json({
                success: false,
                message: "Event not found."
            });
        }

        if (d.data().organizerId !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: "You can only delete your own events."
            });
        }

        await ref.delete();

        res.json({
            success: true,
            message: "Event cancelled and deleted successfully."
        });
    } catch (e) {
        res.status(500).json({
            success: false,
            message: "Could not delete event."
        });
    }
};

exports.listAttendees = async (req, res) => {
    try {
        const e = await db
            .collection("events")
            .doc(req.params.id)
            .get();

        if (!e.exists) {
            return res.status(404).json({
                success: false,
                message: "Event not found."
            });
        }

        if (e.data().organizerId !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: "You can only view attendees for your own event."
            });
        }

        const s = await db
            .collection("tickets")
            .where("eventId", "==", req.params.id)
            .get();

        const a = s.docs
            .map((x) => ({
                id: x.id,
                ...x.data()
            }))
            .filter((x) => x.status === "confirmed");

        res.json({
            success: true,
            count: a.length,
            data: a
        });
    } catch (e) {
        res.status(500).json({
            success: false,
            message: "Could not load attendees."
        });
    }
};
