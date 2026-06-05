import mongoose from "mongoose";

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

// Random user name generator using pre-save hook and full name
userSchema.pre("save", async function (next) {
  // Only generate a username if it is a new document or doesn't have one yet
  if (!this.isModified("fullname") && this.username) {
    return next();
  }

  try {
    // Clean fullname: lowercase and remove non-alphanumeric characters
    const baseUsername = this.fullname.toLowerCase().replace(/[^a-z0-9]/g, "");

    let proposedUsername = baseUsername;
    let isUnique = false;
    let suffix = 1;

    // Loop until we find a username that does not exist in the database
    while (!isUnique) {
      const existingUser = await mongoose.models.User.findOne({
        username: proposedUsername,
      });

      if (!existingUser) {
        isUnique = true;
      } else {
        // Append an incrementing number if a match is found (e.g., johndoe1, johndoe2)
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

export const User = mongoose.model("User", userSchema);
