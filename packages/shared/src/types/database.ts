// =============================================================================
// DAADA FAST FOOD — Types TypeScript générés depuis le schéma PostgreSQL
// packages/shared/src/types/database.ts
// =============================================================================

// ---------------------------------------------------------------------------
// ENUMS
// ---------------------------------------------------------------------------

export type UserRole         = 'client' | 'admin' | 'super_admin' | 'driver' | 'owner'
export type OrderStatus      = 'pending' | 'confirmed' | 'preparing' | 'ready' | 'delivering' | 'delivered' | 'cancelled' | 'refunded'
export type PaymentMethod    = 'mtn' | 'orange' | 'cash'
export type PaymentStatus    = 'pending' | 'paid' | 'failed' | 'refunded'
export type PaymentProvider  = 'cinetpay' | 'cash'
export type PaymentTxnStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'refunded'
export type DeliveryStatus   = 'unassigned' | 'assigned' | 'picked_up' | 'delivered'
export type OptionType       = 'single' | 'multiple'
export type MediaType        = 'image' | 'video_360' | 'video_short'
export type LoyaltyType      = 'earn' | 'redeem' | 'expire' | 'bonus'
export type DiscountType     = 'percent' | 'fixed'
export type StreamStatus     = 'scheduled' | 'live' | 'ended'
export type ReservationStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed'
export type RecipeDifficulty = 'facile' | 'moyen' | 'difficile'
export type StoreType        = 'epicerie' | 'marche' | 'supermarche' | 'grossiste' | 'producteur'
export type SubscriptionPlan = 'monthly' | 'quarterly' | 'yearly'
export type SubStatus        = 'trial' | 'active' | 'expired' | 'cancelled'
export type FraudAction      = 'none' | 'hold' | 'block'
export type ReferralStatus   = 'pending' | 'rewarded'
export type SplitRecipient   = 'restaurant' | 'platform'
export type RefundStatus     = 'pending' | 'processed' | 'failed'

// ---------------------------------------------------------------------------
// CORE
// ---------------------------------------------------------------------------

export interface Restaurant {
  id:                 string
  name:               string
  owner_id:           string | null
  slug:               string
  logo_url:           string | null
  address:            string | null
  lat:                number | null
  lng:                number | null
  delivery_radius_km: number
  commission_rate:    number
  is_active:          boolean
  settings:           Record<string, unknown>
  opening_hours:      OpeningHours
  phone:              string | null
  whatsapp:           string | null
  created_at:         string
  updated_at:         string
}

export interface OpeningHours {
  mon?: DayHours
  tue?: DayHours
  wed?: DayHours
  thu?: DayHours
  fri?: DayHours
  sat?: DayHours
  sun?: DayHours
}

export interface DayHours {
  open:   string  // "08:00"
  close:  string  // "22:00"
  closed?: boolean
}

export interface User {
  id:                 string
  phone:              string
  email:              string | null
  full_name:          string | null
  avatar_url:         string | null
  role:               UserRole
  loyalty_points:     number
  referral_code:      string
  referred_by:        string | null
  device_fingerprint: string | null
  is_blocked:         boolean
  created_at:         string
  updated_at:         string
}

export interface Address {
  id:             string
  user_id:        string
  label:          string | null
  quartier:       string | null
  address_detail: string | null
  landmark:       string | null
  lat:            number | null
  lng:            number | null
  is_default:     boolean
  created_at:     string
}

export interface DeliveryZone {
  id:            string
  restaurant_id: string
  name:          string
  quartiers:     string[]
  geojson:       Record<string, unknown> | null
  delivery_fee:  number
  min_order:     number
  is_active:     boolean
  created_at:    string
}

// ---------------------------------------------------------------------------
// MENU
// ---------------------------------------------------------------------------

export interface Category {
  id:            string
  restaurant_id: string
  name_fr:       string
  name_en:       string | null
  slug:          string
  icon:          string | null
  position:      number
  is_active:     boolean
  created_at:    string
}

export interface MenuItem {
  id:                     string
  restaurant_id:          string
  category_id:            string | null
  name_fr:                string
  name_en:                string | null
  description_fr:         string | null
  description_en:         string | null
  price:                  number
  compare_price:          number | null
  image_url:              string | null
  is_available:           boolean
  is_featured:            boolean
  prep_time_min:          number
  allergens:              string[]
  tags:                   string[]
  nutritional_info:       NutritionalInfo
  stock_count:            number | null
  dynamic_price_enabled:  boolean
  current_price:          number | null
  created_at:             string
  updated_at:             string
}

export interface NutritionalInfo {
  calories?:    number
  proteins?:    number
  carbs?:       number
  fats?:        number
  fiber?:       number
}

export interface ItemOption {
  id:       string
  item_id:  string
  name_fr:  string
  name_en:  string | null
  type:     OptionType
  required: boolean
  position: number
}

export interface OptionChoice {
  id:           string
  option_id:    string
  name_fr:      string
  name_en:      string | null
  price_extra:  number
  is_available: boolean
}

export interface ItemMedia {
  id:         string
  item_id:    string
  url:        string
  type:       MediaType
  position:   number
  created_at: string
}

// ---------------------------------------------------------------------------
// COMMANDES
// ---------------------------------------------------------------------------

export interface Order {
  id:                    string
  restaurant_id:         string
  user_id:               string
  status:                OrderStatus
  items_total:           number
  delivery_fee:          number
  discount:              number
  loyalty_discount:      number
  total:                 number
  payment_method:        PaymentMethod
  payment_status:        PaymentStatus
  delivery_address_id:   string | null
  notes:                 string | null
  coupon_id:             string | null
  loyalty_points_used:   number
  estimated_ready_at:    string | null
  estimated_delivery_at: string | null
  fraud_score:           number
  idempotency_key:       string | null
  created_at:            string
  updated_at:            string
}

export interface OrderItem {
  id:             string
  order_id:       string
  item_id:        string
  quantity:       number
  unit_price:     number
  options_chosen: Record<string, string | string[]>
  subtotal:       number
}

export interface OrderStatusHistory {
  id:          string
  order_id:    string
  from_status: string | null
  to_status:   string
  changed_by:  string | null
  note:        string | null
  created_at:  string
}

// ---------------------------------------------------------------------------
// PAIEMENT
// ---------------------------------------------------------------------------

export interface Payment {
  id:                  string
  order_id:            string
  provider:            PaymentProvider
  transaction_id:      string | null
  amount:              number
  currency:            string
  status:              PaymentTxnStatus
  cinetpay_metadata:   Record<string, unknown>
  webhook_received_at: string | null
  idempotency_key:     string | null
  created_at:          string
}

export interface PaymentSplit {
  id:             string
  payment_id:     string
  recipient_type: SplitRecipient
  amount:         number
  percentage:     number | null
  status:         string
  created_at:     string
}

export interface Refund {
  id:           string
  payment_id:   string
  amount:       number
  reason:       string | null
  status:       RefundStatus
  processed_by: string | null
  created_at:   string
}

// ---------------------------------------------------------------------------
// LIVRAISON
// ---------------------------------------------------------------------------

export interface Delivery {
  id:           string
  order_id:     string
  driver_id:    string | null
  status:       DeliveryStatus
  pickup_at:    string | null
  delivered_at: string | null
  distance_km:  number | null
  duration_min: number | null
  created_at:   string
}

export interface DriverLocation {
  id:          string
  driver_id:   string
  order_id:    string | null
  lat:         number
  lng:         number
  heading:     number | null
  speed:       number | null
  accuracy:    number | null
  recorded_at: string
}

export interface DeliveryRoute {
  id:            string
  delivery_id:   string
  route_geojson: GeoJSON | null
  distance_m:    number | null
  duration_s:    number | null
  created_at:    string
}

// GeoJSON minimal
export interface GeoJSON {
  type:        string
  coordinates: unknown
  features?:   unknown[]
}

// ---------------------------------------------------------------------------
// FIDÉLITÉ & MARKETING
// ---------------------------------------------------------------------------

export interface LoyaltyTransaction {
  id:          string
  user_id:     string
  order_id:    string | null
  points:      number
  type:        LoyaltyType
  description: string | null
  created_at:  string
}

export interface Coupon {
  id:             string
  restaurant_id:  string | null
  code:           string
  discount_type:  DiscountType
  value:          number
  min_order:      number
  max_uses:       number | null
  used_count:     number
  per_user_limit: number
  expires_at:     string | null
  is_active:      boolean
  created_at:     string
}

export interface CouponUsage {
  id:        string
  coupon_id: string
  user_id:   string
  order_id:  string
  used_at:   string
}

export interface Referral {
  id:                   string
  referrer_id:          string
  referee_id:           string
  status:               ReferralStatus
  first_order_id:       string | null
  referrer_reward_fcfa: number
  referee_discount_fcfa: number
  created_at:           string
}

// ---------------------------------------------------------------------------
// NOTIFICATIONS
// ---------------------------------------------------------------------------

export interface Notification {
  id:         string
  user_id:    string
  title_fr:   string | null
  title_en:   string | null
  body_fr:    string | null
  body_en:    string | null
  type:       string | null
  data:       Record<string, unknown>
  read_at:    string | null
  created_at: string
}

// ---------------------------------------------------------------------------
// STREAMING
// ---------------------------------------------------------------------------

export interface Stream {
  id:               string
  restaurant_id:    string
  title:            string
  status:           StreamStatus
  mux_stream_id:    string | null
  mux_playback_id:  string | null
  rtmp_key:         string | null
  thumbnail_url:    string | null
  viewers_count:    number
  scheduled_at:     string | null
  started_at:       string | null
  ended_at:         string | null
  created_at:       string
}

export interface StreamReaction {
  id:         string
  stream_id:  string
  user_id:    string
  emoji:      string
  created_at: string
}

export interface StreamMessage {
  id:           string
  stream_id:    string
  user_id:      string
  message:      string
  is_moderated: boolean
  created_at:   string
}

// ---------------------------------------------------------------------------
// RÉSERVATIONS
// ---------------------------------------------------------------------------

export interface Reservation {
  id:             string
  restaurant_id:  string
  user_id:        string
  date:           string
  time_slot:      string
  guests_count:   number
  status:         ReservationStatus
  special_note:   string | null
  confirmed_at:   string | null
  reminder_sent:  boolean
  created_at:     string
}

export interface ReservationSlot {
  id:            string
  restaurant_id: string
  day_of_week:   number
  time:          string
  max_guests:    number
  is_active:     boolean
}

// ---------------------------------------------------------------------------
// RECETTES & ÉPICIERS
// ---------------------------------------------------------------------------

export interface Recipe {
  id:               string
  restaurant_id:    string | null
  menu_item_id:     string | null
  title_fr:         string
  title_en:         string | null
  description_fr:   string | null
  description_en:   string | null
  cover_image_url:  string | null
  video_url:        string | null
  difficulty:       RecipeDifficulty
  prep_time_min:    number
  cook_time_min:    number
  rest_time_min:    number
  servings_default: number
  cuisine_type:     string | null
  tags:             string[]
  is_premium:       boolean
  is_published:     boolean
  avg_rating:       number
  ratings_count:    number
  created_by:       string | null
  created_at:       string
  updated_at:       string
}

export interface RecipeIngredient {
  id:              string
  recipe_id:       string
  name_fr:         string
  name_en:         string | null
  quantity:        number | null
  unit:            string | null
  is_optional:     boolean
  substitutes:     string[]
  market_category: string | null
  position:        number
}

export interface RecipeStep {
  id:             string
  recipe_id:      string
  position:       number
  title_fr:       string | null
  title_en:       string | null
  instruction_fr: string
  instruction_en: string | null
  image_url:      string | null
  video_url:      string | null
  timer_seconds:  number | null
  chef_tip_fr:    string | null
  chef_tip_en:    string | null
  is_premium:     boolean
}

export interface GroceryStore {
  id:             string
  name:           string
  type:           StoreType
  city:           string
  quartier:       string | null
  address_detail: string | null
  lat:            number | null
  lng:            number | null
  phone:          string | null
  whatsapp:       string | null
  opening_hours:  Record<string, unknown>
  specialties:    string[]
  photo_url:      string | null
  is_verified:    boolean
  is_partner:     boolean
  rating:         number | null
  created_at:     string
}

export interface IngredientPrice {
  id:               string
  ingredient_name:  string
  grocery_store_id: string
  price_fcfa:       number
  unit:             string
  price_date:       string
  notes:            string | null
  reported_by:      string | null
  is_verified:      boolean
  created_at:       string
}

export interface RecipeStore {
  id:               string
  recipe_id:        string
  grocery_store_id: string
  note_fr:          string | null
  note_en:          string | null
}

export interface RecipeReview {
  id:               string
  recipe_id:        string
  user_id:          string
  rating:           number
  comment:          string | null
  photo_url:        string | null
  is_verified_cook: boolean
  helpful_count:    number
  created_at:       string
}

export interface RecipeFavorite {
  id:         string
  recipe_id:  string
  user_id:    string
  created_at: string
}

export interface MealPlan {
  id:                      string
  user_id:                 string
  week_start:              string
  plan:                    MealPlanData
  shopping_list_generated: boolean
  created_at:              string
}

export interface MealPlanData {
  mon?: MealDay
  tue?: MealDay
  wed?: MealDay
  thu?: MealDay
  fri?: MealDay
  sat?: MealDay
  sun?: MealDay
}

export interface MealDay {
  breakfast?: string[]  // recipe IDs
  lunch?:     string[]
  dinner?:    string[]
  snack?:     string[]
}

export interface ShoppingList {
  id:                   string
  user_id:              string
  meal_plan_id:         string | null
  recipe_ids:           string[]
  items:                ShoppingItem[]
  total_estimated_fcfa: number | null
  created_at:           string
}

export interface ShoppingItem {
  name:          string
  quantity:      number
  unit:          string
  category:      string
  estimated_fcfa: number
  store_id?:     string
  checked:       boolean
}

// ---------------------------------------------------------------------------
// IA & ANALYTICS
// ---------------------------------------------------------------------------

export interface PremiumSubscription {
  id:            string
  user_id:       string
  plan:          SubscriptionPlan
  status:        SubStatus
  started_at:    string
  expires_at:    string | null
  trial_ends_at: string | null
  payment_id:    string | null
  auto_renew:    boolean
}

export interface AiRecommendation {
  id:           string
  user_id:      string
  item_ids:     string[]
  explanation:  string | null
  generated_at: string
  expires_at:   string | null
}

export interface FraudScore {
  id:           string
  order_id:     string
  user_id:      string
  score:        number
  signals:      FraudSignals
  action_taken: FraudAction
  created_at:   string
}

export interface FraudSignals {
  multiple_orders?:    boolean
  new_account?:        boolean
  high_value?:         boolean
  suspicious_location?: boolean
  velocity_check?:     boolean
}

export interface PriceHistory {
  id:         string
  item_id:    string
  old_price:  number
  new_price:  number
  reason:     string | null
  changed_by: string | null
  created_at: string
}

export interface SalesForecast {
  id:                string
  restaurant_id:     string
  forecast_date:     string
  predicted_orders:  number | null
  predicted_revenue: number | null
  confidence:        number | null
  factors:           Record<string, unknown>
  created_at:        string
}

// ---------------------------------------------------------------------------
// TYPES COMPOSITES (vues enrichies pour l'UI)
// ---------------------------------------------------------------------------

export interface OrderWithDetails extends Order {
  items:            OrderItem[]
  restaurant:       Pick<Restaurant, 'id' | 'name' | 'logo_url' | 'phone'>
  delivery_address: Address | null
  payment:          Payment | null
  delivery:         Delivery | null
}

export interface MenuItemWithOptions extends MenuItem {
  options: (ItemOption & { choices: OptionChoice[] })[]
  media:   ItemMedia[]
}

export interface RecipeWithDetails extends Recipe {
  ingredients: RecipeIngredient[]
  steps:       RecipeStep[]
  stores:      (RecipeStore & { store: GroceryStore })[]
  reviews:     RecipeReview[]
}

export interface CartItem {
  menu_item:      MenuItem
  quantity:       number
  options_chosen: Record<string, string | string[]>
  subtotal:       number
}

export interface Cart {
  restaurant_id:  string
  items:          CartItem[]
  items_total:    number
  delivery_fee:   number
  discount:       number
  total:          number
  coupon:         Coupon | null
}

// ---------------------------------------------------------------------------
// SUPABASE DATABASE TYPE (pour client typé)
// ---------------------------------------------------------------------------

export interface Database {
  public: {
    Tables: {
      restaurants:          { Row: Restaurant;          Insert: Omit<Restaurant, 'id' | 'created_at' | 'updated_at'>;          Update: Partial<Omit<Restaurant, 'id'>> }
      users:                { Row: User;                Insert: Omit<User, 'created_at' | 'updated_at'>;                        Update: Partial<Omit<User, 'id'>> }
      addresses:            { Row: Address;             Insert: Omit<Address, 'id' | 'created_at'>;                             Update: Partial<Omit<Address, 'id'>> }
      delivery_zones:       { Row: DeliveryZone;        Insert: Omit<DeliveryZone, 'id' | 'created_at'>;                        Update: Partial<Omit<DeliveryZone, 'id'>> }
      categories:           { Row: Category;            Insert: Omit<Category, 'id' | 'created_at'>;                            Update: Partial<Omit<Category, 'id'>> }
      menu_items:           { Row: MenuItem;            Insert: Omit<MenuItem, 'id' | 'created_at' | 'updated_at'>;             Update: Partial<Omit<MenuItem, 'id'>> }
      item_options:         { Row: ItemOption;          Insert: Omit<ItemOption, 'id'>;                                          Update: Partial<Omit<ItemOption, 'id'>> }
      option_choices:       { Row: OptionChoice;        Insert: Omit<OptionChoice, 'id'>;                                        Update: Partial<Omit<OptionChoice, 'id'>> }
      item_media:           { Row: ItemMedia;           Insert: Omit<ItemMedia, 'id' | 'created_at'>;                           Update: Partial<Omit<ItemMedia, 'id'>> }
      orders:               { Row: Order;               Insert: Omit<Order, 'id' | 'created_at' | 'updated_at'>;                Update: Partial<Omit<Order, 'id'>> }
      order_items:          { Row: OrderItem;           Insert: Omit<OrderItem, 'id'>;                                           Update: Partial<Omit<OrderItem, 'id'>> }
      order_status_history: { Row: OrderStatusHistory;  Insert: Omit<OrderStatusHistory, 'id' | 'created_at'>;                  Update: never }
      payments:             { Row: Payment;             Insert: Omit<Payment, 'id' | 'created_at'>;                             Update: Partial<Omit<Payment, 'id'>> }
      payment_splits:       { Row: PaymentSplit;        Insert: Omit<PaymentSplit, 'id' | 'created_at'>;                        Update: Partial<Omit<PaymentSplit, 'id'>> }
      refunds:              { Row: Refund;              Insert: Omit<Refund, 'id' | 'created_at'>;                              Update: Partial<Omit<Refund, 'id'>> }
      deliveries:           { Row: Delivery;            Insert: Omit<Delivery, 'id' | 'created_at'>;                            Update: Partial<Omit<Delivery, 'id'>> }
      driver_locations:     { Row: DriverLocation;      Insert: Omit<DriverLocation, 'id'>;                                      Update: never }
      delivery_routes:      { Row: DeliveryRoute;       Insert: Omit<DeliveryRoute, 'id' | 'created_at'>;                       Update: never }
      loyalty_transactions: { Row: LoyaltyTransaction;  Insert: Omit<LoyaltyTransaction, 'id' | 'created_at'>;                  Update: never }
      coupons:              { Row: Coupon;              Insert: Omit<Coupon, 'id' | 'created_at'>;                              Update: Partial<Omit<Coupon, 'id'>> }
      coupon_usages:        { Row: CouponUsage;         Insert: Omit<CouponUsage, 'id'>;                                         Update: never }
      referrals:            { Row: Referral;            Insert: Omit<Referral, 'id' | 'created_at'>;                            Update: Partial<Omit<Referral, 'id'>> }
      notifications:        { Row: Notification;        Insert: Omit<Notification, 'id' | 'created_at'>;                        Update: Partial<Omit<Notification, 'id'>> }
      streams:              { Row: Stream;              Insert: Omit<Stream, 'id' | 'created_at'>;                              Update: Partial<Omit<Stream, 'id'>> }
      stream_reactions:     { Row: StreamReaction;      Insert: Omit<StreamReaction, 'id' | 'created_at'>;                      Update: never }
      stream_messages:      { Row: StreamMessage;       Insert: Omit<StreamMessage, 'id' | 'created_at'>;                       Update: Partial<Omit<StreamMessage, 'id'>> }
      reservations:         { Row: Reservation;         Insert: Omit<Reservation, 'id' | 'created_at'>;                         Update: Partial<Omit<Reservation, 'id'>> }
      reservation_slots:    { Row: ReservationSlot;     Insert: Omit<ReservationSlot, 'id'>;                                     Update: Partial<Omit<ReservationSlot, 'id'>> }
      recipes:              { Row: Recipe;              Insert: Omit<Recipe, 'id' | 'created_at' | 'updated_at'>;               Update: Partial<Omit<Recipe, 'id'>> }
      recipe_ingredients:   { Row: RecipeIngredient;    Insert: Omit<RecipeIngredient, 'id'>;                                    Update: Partial<Omit<RecipeIngredient, 'id'>> }
      recipe_steps:         { Row: RecipeStep;          Insert: Omit<RecipeStep, 'id'>;                                          Update: Partial<Omit<RecipeStep, 'id'>> }
      grocery_stores:       { Row: GroceryStore;        Insert: Omit<GroceryStore, 'id' | 'created_at'>;                        Update: Partial<Omit<GroceryStore, 'id'>> }
      ingredient_prices:    { Row: IngredientPrice;     Insert: Omit<IngredientPrice, 'id' | 'created_at'>;                     Update: Partial<Omit<IngredientPrice, 'id'>> }
      recipe_stores:        { Row: RecipeStore;         Insert: Omit<RecipeStore, 'id'>;                                         Update: Partial<Omit<RecipeStore, 'id'>> }
      recipe_reviews:       { Row: RecipeReview;        Insert: Omit<RecipeReview, 'id' | 'created_at'>;                        Update: Partial<Omit<RecipeReview, 'id'>> }
      recipe_favorites:     { Row: RecipeFavorite;      Insert: Omit<RecipeFavorite, 'id' | 'created_at'>;                      Update: never }
      meal_plans:           { Row: MealPlan;            Insert: Omit<MealPlan, 'id' | 'created_at'>;                            Update: Partial<Omit<MealPlan, 'id'>> }
      shopping_lists:       { Row: ShoppingList;        Insert: Omit<ShoppingList, 'id' | 'created_at'>;                        Update: Partial<Omit<ShoppingList, 'id'>> }
      premium_subscriptions:{ Row: PremiumSubscription; Insert: Omit<PremiumSubscription, 'id'>;                                  Update: Partial<Omit<PremiumSubscription, 'id'>> }
      ai_recommendations:   { Row: AiRecommendation;   Insert: Omit<AiRecommendation, 'id'>;                                    Update: Partial<Omit<AiRecommendation, 'id'>> }
      fraud_scores:         { Row: FraudScore;          Insert: Omit<FraudScore, 'id' | 'created_at'>;                          Update: Partial<Omit<FraudScore, 'id'>> }
      price_history:        { Row: PriceHistory;        Insert: Omit<PriceHistory, 'id' | 'created_at'>;                        Update: never }
      sales_forecasts:      { Row: SalesForecast;       Insert: Omit<SalesForecast, 'id' | 'created_at'>;                       Update: Partial<Omit<SalesForecast, 'id'>> }
    }
    Functions: {
      haversine_km:         { Args: { lat1: number; lng1: number; lat2: number; lng2: number }; Returns: number }
      restaurants_nearby:   { Args: { p_lat: number; p_lng: number; p_radius_km?: number };     Returns: Restaurant[] }
      grocery_stores_nearby:{ Args: { p_lat: number; p_lng: number; p_radius_km?: number };     Returns: GroceryStore[] }
      is_premium:           { Args: { p_user_id?: string };                                      Returns: boolean }
      loyalty_balance:      { Args: { p_user_id?: string };                                      Returns: number }
    }
  }
}
