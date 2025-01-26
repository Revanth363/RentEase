const Contact = require('../models/contactus');

// Get all contact submissions
exports.getAllSubmissions = async (req, res) => {
  try {
    const submissions = await Contact.find().lean();
    submissions.forEach(s => {
      s.id = s._id.toString();
      s.submittedAt = s.submittedAt ? new Date(s.submittedAt).toLocaleString() : 'N/A';
    });
    res.json(submissions);
  } catch (err) {
    console.error('Error fetching contact submissions:', err);
    res.status(500).json({ error: 'Server Error' });
  }
};

// Get single submission by ID
exports.getSubmissionById = async (req, res) => {
  try {
    const submission = await Contact.findById(req.params.id).lean();
    if (!submission) {
      return res.status(404).json({ error: 'Submission not found' });
    }
    submission.id = submission._id.toString();
    submission.submittedAt = submission.submittedAt ? new Date(submission.submittedAt).toLocaleString() : 'N/A';
    res.json(submission);
  } catch (err) {
    console.error('Error fetching submission:', err);
    res.status(500).json({ error: 'Server Error' });
  }
};