// ─── Foundation ──────────────────────────────────────────────────────────────
export { cn, formatPrice, formatDuration, getInitials, debounce } from './src/utils'
export { tokens, cssVariablesBlock } from './src/tokens'
export type { DesignTokens } from './src/tokens'
export { animationClasses, variants, staggerChildren, listItem } from './src/animations'

// ─── Icons ───────────────────────────────────────────────────────────────────
export {
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  CheckIcon,
  CheckCircleIcon,
  XIcon,
  PlusIcon,
  MinusIcon,
  SearchIcon,
  MapPinIcon,
  ClockIcon,
  PhoneIcon,
  StarIcon,
  HeartIcon,
  ShoppingCartIcon,
  PackageIcon,
  TruckIcon,
  HomeIcon,
  UserIcon,
  BellIcon,
  SendIcon,
  MicIcon,
  CameraIcon,
  ImageIcon,
  PlayIcon,
  PauseIcon,
  TimerIcon,
  ChefHatIcon,
  LeafIcon,
  FireIcon,
  TagIcon,
  CopyIcon,
  ShareIcon,
  WhatsappIcon,
  CalendarIcon,
  ExternalLinkIcon,
  LoaderIcon,
  AlertCircleIcon,
  InfoIcon,
  LockIcon,
  UnlockIcon,
  ThumbsUpIcon,
} from './src/icons'

// ─── Atoms ───────────────────────────────────────────────────────────────────
export { Button } from './src/atoms/Button'
export type { ButtonProps } from './src/atoms/Button'

export { Input } from './src/atoms/Input'
export type { InputProps } from './src/atoms/Input'

export { PhoneInput } from './src/atoms/PhoneInput'
export type { PhoneInputProps } from './src/atoms/PhoneInput'

export { SearchInput } from './src/atoms/SearchInput'
export type { SearchInputProps } from './src/atoms/SearchInput'

export { Textarea } from './src/atoms/Textarea'
export type { TextareaProps } from './src/atoms/Textarea'

export { Select } from './src/atoms/Select'
export type { SelectProps, SelectOption } from './src/atoms/Select'

export { Switch } from './src/atoms/Switch'
export type { SwitchProps } from './src/atoms/Switch'

export { Checkbox } from './src/atoms/Checkbox'
export type { CheckboxProps } from './src/atoms/Checkbox'

export { Radio, RadioGroup } from './src/atoms/Radio'
export type { RadioProps, RadioGroupProps, RadioOption } from './src/atoms/Radio'

export { Slider } from './src/atoms/Slider'
export type { SliderProps } from './src/atoms/Slider'

export { Badge } from './src/atoms/Badge'
export type { BadgeProps, BadgeVariant, BadgeSize } from './src/atoms/Badge'

export { Tag, getTagColor } from './src/atoms/Tag'
export type { TagProps } from './src/atoms/Tag'

export { Avatar } from './src/atoms/Avatar'
export type { AvatarProps, AvatarSize } from './src/atoms/Avatar'

export { Spinner } from './src/atoms/Spinner'
export type { SpinnerProps } from './src/atoms/Spinner'

export {
  Skeleton,
  MenuItemCardSkeleton,
  RecipeCardSkeleton,
  OrderCardSkeleton,
  SkeletonText,
} from './src/atoms/Skeleton'
export type { SkeletonProps } from './src/atoms/Skeleton'

export { Divider } from './src/atoms/Divider'
export type { DividerProps } from './src/atoms/Divider'

export { PriceDisplay } from './src/atoms/PriceDisplay'
export type { PriceDisplayProps } from './src/atoms/PriceDisplay'

export { RatingStars } from './src/atoms/RatingStars'
export type { RatingStarsProps } from './src/atoms/RatingStars'

export { ProgressBar } from './src/atoms/ProgressBar'
export type { ProgressBarProps } from './src/atoms/ProgressBar'

export { KPICard } from './src/atoms/KPICard'
export type { KPICardProps } from './src/atoms/KPICard'

// ─── Molecules ────────────────────────────────────────────────────────────────
export { MenuItemCard } from './src/molecules/MenuItemCard'
export type { MenuItemCardProps } from './src/molecules/MenuItemCard'

export { RecipeCard } from './src/molecules/RecipeCard'
export type { RecipeCardProps } from './src/molecules/RecipeCard'

export { CartItem } from './src/molecules/CartItem'
export type { CartItemProps } from './src/molecules/CartItem'

export { OrderStatusBadge, OrderStatusTimeline } from './src/molecules/OrderStatusBadge'
export type { OrderStatusBadgeProps, OrderStatusTimelineProps, OrderStatus } from './src/molecules/OrderStatusBadge'

export { GroceryStoreCard } from './src/molecules/GroceryStoreCard'
export type { GroceryStoreCardProps, GroceryStore } from './src/molecules/GroceryStoreCard'

export { IngredientRow } from './src/molecules/IngredientRow'
export type { IngredientRowProps, IngredientStore } from './src/molecules/IngredientRow'

export { RecipeStepCard } from './src/molecules/RecipeStepCard'
export type { RecipeStepCardProps } from './src/molecules/RecipeStepCard'

export { LoyaltyCard } from './src/molecules/LoyaltyCard'
export type { LoyaltyCardProps, LoyaltyLevel } from './src/molecules/LoyaltyCard'

export { CouponInput } from './src/molecules/CouponInput'
export type { CouponInputProps } from './src/molecules/CouponInput'

export { ReferralCard } from './src/molecules/ReferralCard'
export type { ReferralCardProps } from './src/molecules/ReferralCard'

export { PremiumGate } from './src/molecules/PremiumGate'
export type { PremiumGateProps, PremiumPlan } from './src/molecules/PremiumGate'

export { PremiumBadge } from './src/molecules/PremiumBadge'
export type { PremiumBadgeProps } from './src/molecules/PremiumBadge'

export { QuantityStepper } from './src/molecules/QuantityStepper'
export type { QuantityStepperProps } from './src/molecules/QuantityStepper'

export { NotificationItem } from './src/molecules/NotificationItem'
export type { NotificationItemProps, NotificationType } from './src/molecules/NotificationItem'

export { ReviewCard } from './src/molecules/ReviewCard'
export type { ReviewCardProps } from './src/molecules/ReviewCard'

export { DeliveryZoneBadge } from './src/molecules/DeliveryZoneBadge'
export type { DeliveryZoneBadgeProps } from './src/molecules/DeliveryZoneBadge'

export { ETA } from './src/molecules/ETA'
export type { ETAProps } from './src/molecules/ETA'

// ─── Organisms ────────────────────────────────────────────────────────────────
export { Navbar } from './src/organisms/Navbar'
export type { NavbarProps } from './src/organisms/Navbar'

export { BottomTabBar } from './src/organisms/BottomTabBar'
export type { BottomTabBarProps, TabItem } from './src/organisms/BottomTabBar'

export { CategoryTabsBar } from './src/organisms/CategoryTabsBar'
export type { CategoryTabsBarProps, Category } from './src/organisms/CategoryTabsBar'

export { CartDrawer } from './src/organisms/CartDrawer'
export type { CartDrawerProps } from './src/organisms/CartDrawer'

export { CartSummary } from './src/organisms/CartSummary'
export type { CartSummaryProps } from './src/organisms/CartSummary'

export { OrderCard } from './src/organisms/OrderCard'
export type { OrderCardProps } from './src/organisms/OrderCard'

export { OrderDetailCard } from './src/organisms/OrderDetailCard'
export type { OrderDetailCardProps } from './src/organisms/OrderDetailCard'

export { MapPicker } from './src/organisms/MapPicker'
export type { MapPickerProps, DeliveryZone } from './src/organisms/MapPicker'

export { DriverTracker } from './src/organisms/DriverTracker'
export type { DriverTrackerProps } from './src/organisms/DriverTracker'

export { LiveStreamPlayer } from './src/organisms/LiveStreamPlayer'
export type { LiveStreamPlayerProps, StreamMessage, StreamReaction } from './src/organisms/LiveStreamPlayer'

export { ChatbotWidget } from './src/organisms/ChatbotWidget'
export type { ChatbotWidgetProps, ChatMessage, ChatbotType } from './src/organisms/ChatbotWidget'

export { StepByStepMode } from './src/organisms/StepByStepMode'
export type { StepByStepModeProps, RecipeStep } from './src/organisms/StepByStepMode'

export { MealPlanGrid } from './src/organisms/MealPlanGrid'
export type { MealPlanGridProps, MealPlanDay, MealPlanEntry, MealSlot } from './src/organisms/MealPlanGrid'

export { ShoppingListView } from './src/organisms/ShoppingListView'
export type { ShoppingListViewProps, ShoppingListItem, ShoppingListByStore } from './src/organisms/ShoppingListView'

export { PriceReporterForm } from './src/organisms/PriceReporterForm'
export type { PriceReporterFormProps, PriceReportStore } from './src/organisms/PriceReporterForm'

export { EmptyState } from './src/organisms/EmptyState'
export type { EmptyStateProps, EmptyStateVariant } from './src/organisms/EmptyState'

export { Modal, useModal, ModalProvider, useModalContext } from './src/organisms/Modal'
export type { ModalProps, UseModalReturn } from './src/organisms/Modal'

export { ConfirmDialog } from './src/organisms/ConfirmDialog'
export type { ConfirmDialogProps } from './src/organisms/ConfirmDialog'
