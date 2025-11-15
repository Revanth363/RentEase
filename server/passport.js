const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;

const Tenant = require("./models/tenant");
const Owner = require("./models/owner");
const Worker = require("./models/worker");

// Construct full callback URL (required by Google OAuth)
const callbackURL = process.env.GOOGLE_CALLBACK_URL || 
  (process.env.NODE_ENV === 'production' 
    ? 'https://ffsd-repo-react.onrender.com/auth/google/callback'
    : 'http://localhost:5000/auth/google/callback');

console.log('[Passport] Google OAuth Callback URL:', callbackURL);

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: callbackURL,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        // 🔐 Defensive email extraction
        const email = profile.emails?.[0]?.value;
        if (!email) {
          return done(new Error("Google account has no email"), null);
        }

        const firstName = profile.name?.givenName || "";
        const lastName = profile.name?.familyName || "";

        // 🔍 Check across all user types
        let user =
          (await Tenant.findOne({ email })) ||
          (await Owner.findOne({ email })) ||
          (await Worker.findOne({ email }));

        // ➕ Auto-create tenant if user does not exist
        if (!user) {
          user = await Tenant.create({
            firstName,
            lastName,
            email,
            password: "google-auth", // dummy password (never used)
            userType: "tenant",
          });
        }

        return done(null, user);
      } catch (err) {
        return done(err, null);
      }
    }
  )
);

module.exports = passport;
