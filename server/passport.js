const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;

const Tenant = require("./models/tenant");
const Owner = require("./models/owner");
const Worker = require("./models/worker");

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "/auth/google/callback",
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
