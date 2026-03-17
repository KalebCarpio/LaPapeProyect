// src/models/User.js
import { DataTypes, Model } from "sequelize";
import { sequelize } from "../db.js";

class User extends Model {
  clearExpiredSessions(now = new Date()) {
    const sessions = Array.isArray(this.sessions) ? this.sessions : [];
    this.sessions = sessions.filter((s) => s?.expiresAt && new Date(s.expiresAt) > now);
  }
}

User.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },

    nombre: { type: DataTypes.STRING, allowNull: false },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      set(value) {
        this.setDataValue("email", String(value || "").toLowerCase().trim());
      },
    },
    passwordHash: { type: DataTypes.STRING, allowNull: false },

    rol: {
      type: DataTypes.ENUM("CLIENTE", "TRABAJADOR", "DUENO", "ADMIN"),
      allowNull: false,
      defaultValue: "CLIENTE",
    },

    // Login social
    provider: { type: DataTypes.ENUM("LOCAL", "GOOGLE"), allowNull: false, defaultValue: "LOCAL" },
    providerId: { type: DataTypes.STRING, allowNull: true },
    avatarUrl: { type: DataTypes.STRING, allowNull: true },

    // Verificación de cuenta
    isVerified: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    verifyCode: { type: DataTypes.STRING, allowNull: true },
    verifyCodeExpires: { type: DataTypes.DATE, allowNull: true },

    // Config login / 2FA
    twoFAEnabled: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    loginMethod: {
      type: DataTypes.ENUM("PASSWORD_ONLY", "PASSWORD_2FA", "PASSWORD_SECRET"),
      allowNull: false,
      defaultValue: "PASSWORD_2FA",
    },
    secretQuestion: { type: DataTypes.STRING, allowNull: true },
    secretAnswerHash: { type: DataTypes.STRING, allowNull: true },

    twoFAHash: { type: DataTypes.STRING, allowNull: true },
    twoFAExp: { type: DataTypes.DATE, allowNull: true },

    // Recuperación de contraseña
    resetOTPHash: { type: DataTypes.STRING, allowNull: true },
    resetOTPExp: { type: DataTypes.DATE, allowNull: true },

    // Seguridad
    resetAttempts: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    resetLastAttemptAt: { type: DataTypes.DATE, allowNull: true },
    resetBlockedUntil: { type: DataTypes.DATE, allowNull: true },

    failedLoginAttempts: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    lockUntil: { type: DataTypes.DATE, allowNull: true },

    passwordChangesCount: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    passwordChangesDate: { type: DataTypes.DATE, allowNull: true },

    // Sesiones (JSONB)
    lastLoginAt: { type: DataTypes.DATE, allowNull: true },
    sessions: { type: DataTypes.JSONB, allowNull: false, defaultValue: [] },
  },
  {
    sequelize,
    modelName: "User",
    tableName: "users",
    timestamps: true,
    indexes: [{ unique: true, fields: ["email"] }],
  }
);

export default User;