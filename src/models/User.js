import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      minlength: 3,
      maxlength: 30,
      lowercase: true
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true
    },
    password: {
      type: String,
      required: true,
      select: false
    },
    bio: {
      type: String,
      default: '',
      maxlength: 280
    },
    profilePic: {
      type: String,
      default: ''
    },
    followersCount: {
      type: Number,
      default: 0,
      min: 0
    },
    followingCount: {
      type: Number,
      default: 0,
      min: 0
    },
    refreshTokenHash: {
      type: String,
      select: false
    }
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_doc, ret) => {
        delete ret.password;
        delete ret.refreshTokenHash;
        delete ret.__v;
        return ret;
      }
    }
  }
);

export const User = mongoose.model('User', userSchema);
