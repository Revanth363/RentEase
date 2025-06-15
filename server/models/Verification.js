const mongoose = require('mongoose');
const { Schema } = mongoose;

const verificationSchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    refPath: 'userModel',
    required: true
  },
  userModel: {
    type: String,
    required: true,
    enum: ['tenant', 'owner', 'worker']
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  documents: [{
    url: String,
    public_id: String,
    type: {
      type: String,
      enum: [
        'aadhaar', 'pan', 'driving_license', 'college_id', 'other_proof',
        'skill_certificate', 'property_proof', ''
      ],
      required: false,
    },
    skillType: {
      type: String,
      enum: ['cook', 'cleaning', 'gardening', 'caretaker', 'other'],
      required: false
    }
  }],
  rejectionReason: {
    type: String
  },
  reviewer: {
    type: Schema.Types.ObjectId,
    ref: 'admin'
  }
}, { timestamps: true });

module.exports = mongoose.model('Verification', verificationSchema);