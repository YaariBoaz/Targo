# Product IDs Reference

## 📦 Product IDs for Google Play Console

When creating products in Google Play Console, use these **exact** Product IDs:

### Premium Subscriptions

| Product ID | Name | Type | Suggested Price |
|------------|------|------|-----------------|
| `targo_premium_monthly` | Targo Premium Monthly | Subscription | $9.99/month |
| `targo_premium_yearly` | Targo Premium Yearly | Subscription | $99.99/year |

### Consumable Products (Bullets Packs)

| Product ID | Name | Type | Suggested Price |
|------------|------|------|-----------------|
| `targo_bullets_100` | 100 Bullets Pack | Managed product | $0.99 |
| `targo_bullets_500` | 500 Bullets Pack | Managed product | $4.99 |
| `targo_bullets_1000` | 1000 Bullets Pack | Managed product | $9.99 |

---

## 🔑 Important Notes

1. **Product IDs must match exactly** - Copy and paste to avoid typos
2. These IDs are defined in `src/app/core/services/in-app-purchase.service.ts`
3. Create these products in Google Play Console **first**
4. Then add them to RevenueCat dashboard with the **same IDs**
5. For testing, prices don't matter (no real money charged)

---

## 🎯 Where to Create Products

### Google Play Console
1. Go to: **Monetize → Products → In-app products**
2. Click **"Create product"**
3. Enter the Product ID from the table above
4. Fill in name, description, and price
5. Set status to **"Active"**

### RevenueCat Dashboard
1. Go to: **Products** tab
2. Click **"Add Product"**
3. Enter the same Product ID
4. Select **"Google Play Store"**
5. Products will automatically sync

---

## 🧪 Testing Mode

When testing with License Testing accounts:
- All purchases are **sandbox/test purchases**
- **NO REAL MONEY** is charged
- Purchases automatically cancel after a few minutes
- You can test unlimited times

---

## 📱 How to Use in Code

```typescript
// Check if user has premium
const isPremium = this.purchaseService.isPremiumUser();

// Get product IDs
const productIds = this.purchaseService.getProductIds();
// Returns: { PREMIUM_MONTHLY: 'targo_premium_monthly', ... }

// Purchase a package
await this.purchaseService.purchasePackage(package);

// Restore purchases
await this.purchaseService.restorePurchases();
```

---

## 🔐 RevenueCat Configuration

### Entitlements
Create an entitlement called **"premium"** in RevenueCat and attach:
- `targo_premium_monthly`
- `targo_premium_yearly`

### Offerings
Create an offering called **"Premium"** with packages:
- **Monthly**: `targo_premium_monthly`
- **Yearly**: `targo_premium_yearly`

---

## 📋 Quick Copy-Paste List

```
targo_premium_monthly
targo_premium_yearly
targo_bullets_100
targo_bullets_500
targo_bullets_1000
```
