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
        const email = profile.emails[0].value;
        const firstName = profile.name.givenName || "";
        const lastName = profile.name.familyName || "";

        // Check existing user
        let user =
          (await Tenant.findOne({ email })) ||
          (await Owner.findOne({ email })) ||
          (await Worker.findOne({ email }));

        // Auto-create tenant if not exists
        if (!user) {
          user = await Tenant.create({
            firstName,
            lastName,
            email,
            password: "google-auth",
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

passport.serializeUser((user, done) => {
  done(null, user._id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user =
      (await Tenant.findById(id)) ||
      (await Owner.findById(id)) ||
      (await Worker.findById(id));

    done(null, user);
  } catch (err) {
    done(err, null);
  }
});
