const Contact = require('../models/contactus');

// Controller to handle form submission
exports.submitForm = async (req, res) => {
  try {
    const { name, email, phone, subject, message } = req.body;

    // Basic validation
    if (!name || !email || !subject || !message) {
      return res.status(400).json({ error: 'Name, email, subject, and message are required' });
    }

    // Validate email (must be a Gmail address)
    const emailRegex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Please provide a valid Gmail address' });
    }

    // Validate phone number if provided (must be 10 digits)
    if (phone && !/^\d{10}$/.test(phone)) {
      return res.status(400).json({ error: 'Please provide a valid 10-digit phone number' });
    }

    // Create new contact entry
    const contact = new Contact({
      name,
      email,
      phone: phone || '',
      subject,
      message,
    });

    // Save to MongoDB
    await contact.save();

    res.status(200).json({ message: 'Form submitted successfully' });
  } catch (error) {
    console.error('Error submitting form:', error);
    res.status(500).json({ error: 'Server error, please try again later' });
  }
};

// Controller to retrieve all contact submissions
exports.getAllSubmissions = async (req, res) => {
  try {
    const allSubmissions = await Contact.find({});
    res.status(200).json(allSubmissions);
  } catch (error) {
    console.error('Error retrieving contact submissions:', error);
    res.status(500).json({ error: 'Failed to retrieve submissions' });
  }
};