import {
  pgTable,
  text,
  timestamp,
  boolean,
  integer,
  jsonb,
  uuid,
  varchar,
  numeric,
} from "drizzle-orm/pg-core";

// ── better-auth tables ──────────────────────────────────────────────

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull(),
  image: text("image"),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
});

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expires_at").notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id")
    .notNull()
    .references(() => user.id),
});

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at"),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
});

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at"),
  updatedAt: timestamp("updated_at"),
});

// ── GeeTorus domain tables ──────────────────────────────────────────

export const listings = pgTable("listings", {
  id: uuid("id").defaultRandom().primaryKey(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  type: varchar("type", { length: 50 }).notNull(), // team_blueprint, agent_blueprint, skill, governance_template
  title: varchar("title", { length: 255 }).notNull(),
  tagline: varchar("tagline", { length: 120 }),
  description: text("description"),
  price: integer("price").notNull().default(0), // cents
  creatorId: uuid("creator_id")
    .notNull()
    .references(() => creators.id),
  categories: jsonb("categories").$type<string[]>().default([]),
  tags: jsonb("tags").$type<string[]>().default([]),
  agentCount: integer("agent_count"),
  previewImages: jsonb("preview_images").$type<string[]>().default([]),
  readmeMarkdown: text("readme_markdown"),
  includedFiles: jsonb("included_files").$type<string[]>().default([]),
  compatibleAdapters: jsonb("compatible_adapters").$type<string[]>().default([]),
  requiredModels: jsonb("required_models").$type<string[]>().default([]),
  installCount: integer("install_count").notNull().default(0),
  rating: numeric("rating", { precision: 2, scale: 1 }),
  reviewCount: integer("review_count").notNull().default(0),
  version: varchar("version", { length: 20 }).default("1.0.0"),
  status: varchar("status", { length: 20 }).notNull().default("draft"), // draft, published, archived
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const creators = pgTable("creators", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id),
  displayName: varchar("display_name", { length: 100 }).notNull(),
  bio: text("bio"),
  avatarUrl: text("avatar_url"),
  website: text("website"),
  totalInstalls: integer("total_installs").notNull().default(0),
  totalRevenue: integer("total_revenue").notNull().default(0), // cents
  verified: boolean("verified").notNull().default(false),
  stripeAccountId: text("stripe_account_id"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const purchases = pgTable("purchases", {
  id: uuid("id").defaultRandom().primaryKey(),
  listingId: uuid("listing_id")
    .notNull()
    .references(() => listings.id),
  buyerUserId: text("buyer_user_id")
    .notNull()
    .references(() => user.id),
  buyerCompanyId: text("buyer_company_id"),
  pricePaidCents: integer("price_paid_cents").notNull().default(0),
  status: varchar("status", { length: 20 }).notNull().default("pending"), // pending, completed, refunded
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const reviews = pgTable("reviews", {
  id: uuid("id").defaultRandom().primaryKey(),
  listingId: uuid("listing_id")
    .notNull()
    .references(() => listings.id),
  authorUserId: text("author_user_id")
    .notNull()
    .references(() => user.id),
  rating: integer("rating").notNull(), // 1-5
  title: varchar("title", { length: 255 }),
  body: text("body"),
  verifiedPurchase: boolean("verified_purchase").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const teamBlueprints = pgTable("team_blueprints", {
  id: uuid("id").defaultRandom().primaryKey(),
  listingId: uuid("listing_id")
    .notNull()
    .references(() => listings.id),
  agents: jsonb("agents").notNull(),
  reportingChain: jsonb("reporting_chain").notNull(),
  governance: jsonb("governance"),
  projects: jsonb("projects"),
  companyDefaults: jsonb("company_defaults"),
});
