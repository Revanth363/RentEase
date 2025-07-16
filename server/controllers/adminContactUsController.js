// controllers/AdminContactusController.js
const Contact = require("../models/contactus");

exports.getAllSubmissions = async (req, res) => {
  try {
    const { fromDate, toDate, page = 1, limit = 500 } = req.query;

    const matchFilter = {};
    if (fromDate || toDate) {
      matchFilter.submittedAt = {};
      if (fromDate) matchFilter.submittedAt.$gte = new Date(fromDate);
      if (toDate) {
        const end = new Date(toDate);
        end.setHours(23, 59, 59, 999);
        matchFilter.submittedAt.$lte = end;
      }
    }

    const skip = (Number(page) - 1) * Number(limit);

    const submissions = await Contact.find(matchFilter)
      .sort({ submittedAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .lean();

    const formatted = submissions.map(s => ({
      id: s._id.toString(),
      name: s.name || 'Anonymous',
      email: s.email || 'N/A',
      phone: s.phone || 'N/A',
      subject: s.subject || '(No subject)',
      message: s.message?.slice(0, 60) + (s.message?.length > 60 ? '...' : '') || '',
      submittedAt: s.submittedAt,
      submittedAtFormatted: s.submittedAt
        ? new Date(s.submittedAt).toLocaleString('en-IN', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            timeZoneName: 'short'
          })
        : 'N/A'
    }));

    res.json({ contactSubmissions: formatted });
  } catch (err) {
    console.error('Error:', err);
    res.status(500).json({ error: 'Server Error' });
  }
};

exports.getSubmissionById = async (req, res) => {
  try {
    const submission = await Contact.findById(req.params.id).lean();
    if (!submission) return res.status(404).json({ error: "Not found" });

    res.json({
      id: submission._id.toString(),
      name: submission.name || "Anonymous",
      email: submission.email || "N/A",
      phone: submission.phone || "N/A",
      subject: submission.subject || "(No subject)",
      message: submission.message || "No message",
      // ← CRITICAL: Send raw date + formatted version
      submittedAt: submission.submittedAt, // ISO string → safe for new Date()
      submittedAtFormatted: submission.submittedAt
        ? new Date(submission.submittedAt).toLocaleString("en-IN", {
            year: "numeric",
            month: "long",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
            timeZoneName: "short",
          })
        : "Date not available",
    });
  } catch (err) {
    console.error("Error:", err);
    res.status(500).json({ error: "Server Error" });
  }
};
