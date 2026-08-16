import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser extends Document {
  name: string;
  email: string;
  passwordHash: string;
  timezone: string;
  weekStartDay: 0 | 1; // 0 = Sunday, 1 = Monday
  theme: 'light' | 'dark' | 'system';
  profileImage?: string;
  onboardingCompleted: boolean;
  gamificationEnabled: boolean;
  xp: number;
  level: number;
  resetPasswordToken?: string;
  resetPasswordExpires?: Date;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: { type: String, required: true },
    timezone: { type: String, default: 'UTC' },
    weekStartDay: { type: Number, enum: [0, 1], default: 1 },
    theme: { type: String, enum: ['light', 'dark', 'system'], default: 'system' },
    profileImage: { type: String },
    onboardingCompleted: { type: Boolean, default: false },
    gamificationEnabled: { type: Boolean, default: true },
    xp: { type: Number, default: 0 },
    level: { type: Number, default: 1 },
    resetPasswordToken: { type: String },
    resetPasswordExpires: { type: Date },
  },
  { timestamps: true }
);

// Hash password before save
UserSchema.pre('save', async function (next) {
  if (!this.isModified('passwordHash')) return next();
  const salt = await bcrypt.genSalt(12);
  this.passwordHash = await bcrypt.hash(this.passwordHash, salt);
  next();
});

UserSchema.methods.comparePassword = async function (
  candidatePassword: string
): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.passwordHash);
};

// Never return password in JSON
UserSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.passwordHash;
  delete obj.resetPasswordToken;
  delete obj.resetPasswordExpires;
  return obj;
};

export const User = mongoose.model<IUser>('User', UserSchema);
