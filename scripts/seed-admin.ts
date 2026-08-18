/**
 * Seed the first Society Admin.
 *
 * There is no public registration for internal roles (spec §4), so bootstrap the
 * first admin with this script. Run against the emulator or a live project.
 *
 *   Emulator:
 *     FIREBASE_AUTH_EMULATOR_HOST=localhost:9099 \
 *     FIRESTORE_EMULATOR_HOST=localhost:8080 \
 *     npm run seed:admin -- --email admin@example.com --password "Passw0rd!" --name "Rishi"
 *
 *   Live (needs FIREBASE_SERVICE_ACCOUNT_B64 in .env.local):
 *     npm run seed:admin -- --email admin@example.com --password "Passw0rd!" --name "Rishi"
 */
import { config } from "dotenv";
import { adminAuth } from "../src/lib/firebase/admin";
import { createUserProfile, getUserProfile } from "../src/lib/firebase/users";
import { DEFAULT_SOCIETY_ID } from "../src/lib/config";

config({ path: ".env.local" });

function arg(name: string): string | undefined {
  const idx = process.argv.indexOf(`--${name}`);
  return idx >= 0 ? process.argv[idx + 1] : undefined;
}

async function main() {
  const email = arg("email");
  const password = arg("password");
  const name = arg("name") ?? "Society Admin";
  const societyId = arg("society") ?? DEFAULT_SOCIETY_ID;

  if (!email || !password) {
    console.error(
      "Usage: npm run seed:admin -- --email <email> --password <password> [--name <name>] [--society <id>]",
    );
    process.exit(1);
  }

  // Create or reuse the Auth user.
  let uid: string;
  try {
    const existing = await adminAuth().getUserByEmail(email);
    uid = existing.uid;
    await adminAuth().updateUser(uid, { password, emailVerified: true });
    console.log(`Reusing existing auth user ${uid}.`);
  } catch {
    const created = await adminAuth().createUser({
      email,
      password,
      displayName: name,
      emailVerified: true,
    });
    uid = created.uid;
    console.log(`Created auth user ${uid}.`);
  }

  const existingProfile = await getUserProfile(uid);
  if (existingProfile) {
    console.log("Profile already exists — nothing to do.");
    return;
  }

  await createUserProfile({
    uid,
    email,
    displayName: name,
    status: "ACTIVE",
    societyId,
    roleIds: ["society_admin"],
  });

  console.log(`\n✅ Society Admin ready:\n   ${email}  (society: ${societyId})`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
