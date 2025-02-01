// controllers/AdminContactusController.js
const Contact = require('../models/contactus');

exports.getAllSubmissions = async (req, res) => {
  try {
    const submissions = await Contact.find().sort({ submittedAt: -1 }).lean();

    const formatted = submissions.map(s => ({
      id: s._id.toString(),
      name: s.name || 'Anonymous',
      email: s.email || 'N/A',
      phone: s.phone || 'N/A',
      subject: s.subject || '(No subject)',
      message: s.message?.slice(0, 60) + (s.message?.length > 60 ? '...' : '') || '',
      submittedAt: s.submittedAt, // ← Keep as ISO string (Date object)
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

    res.json(formatted);
  } catch (err) {
    console.error('Error:', err);
    res.status(500).json({ error: 'Server Error' });
  }
};

exports.getSubmissionById = async (req, res) => {
  try {
    const submission = await Contact.findById(req.params.id).lean();
    if (!submission) return res.status(404).json({ error: 'Not found' });

    res.json({
      id: submission._id.toString(),
      name: submission.name || 'Anonymous',
      email: submission.email || 'N/A',
      phone: submission.phone || 'N/A',
      subject: submission.subject || '(No subject)',
      message: submission.message || 'No message',
      // ← CRITICAL: Send raw date + formatted version
      submittedAt: submission.submittedAt, // ISO string → safe for new Date()
      submittedAtFormatted: submission.submittedAt
        ? new Date(submission.submittedAt).toLocaleString('en-IN', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            timeZoneName: 'short'
          })
        : 'Date not available'
    });
  } catch (err) {
    console.error('Error:', err);
    res.status(500).json({ error: 'Server Error' });
  }
};