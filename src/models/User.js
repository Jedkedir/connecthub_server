import mongoose from "mongoose";

/**
 * Stores user identity, profile data, denormalized follow counts, and token hash state.
 */
const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      lowercase: true,
      unique: true,
      trim: true,
    },
    fullname: {
      type: String,
      required: true,
      trim: true,
      minlength: 3,
      maxlength: 30,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
      select: false,
    },
    bio: {
      type: String,
      default: "",
      maxlength: 280,
    },
    profilePic: {
      type: String,
      default: "",
    },
    followersCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    followingCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    refreshTokenHash: {
      type: String,
      select: false,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_doc, ret) => {
        delete ret.password;
        delete ret.refreshTokenHash;
        delete ret.__v;
        return ret;
      },
    },
  },
);
userSchema.index({ fullname: 1 });

/**
 * Generates a unique username from fullname before saving when needed.
 */
userSchema.pre("save", async function (next) {
  if (!this.isModified("fullname") && this.username) {
    return next();
  }

  try {
    const baseUsername = this.fullname.toLowerCase().replace(/[^a-z0-9]/g, "");

    let proposedUsername = baseUsername;
    let isUnique = false;
    let suffix = 1;

    while (!isUnique) {
      const existingUser = await mongoose.models.User.findOne({
        username: proposedUsername,
      });

      if (!existingUser) {
        isUnique = true;
      } else {
        proposedUsername = `${baseUsername}${suffix}`;
        suffix++;
      }
    }

    this.username = proposedUsername;
    next();
  } catch (error) {
    next(error);
  }
});

/**
 * User model for account and profile records.
 */
export const User = mongoose.model("User", userSchema);
