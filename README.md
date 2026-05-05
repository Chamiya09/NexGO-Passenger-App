<div align="center">
  <img src="./assets/images/Passanger%20App%20Logo.png" width="110" alt="NexGO Passenger logo" />

# NexGO Passenger

### Book rides, follow the trip, pay, review, and move.

[![Expo](https://img.shields.io/badge/Expo-SDK_54-000020?style=for-the-badge&logo=expo)](https://expo.dev/)
[![React Native](https://img.shields.io/badge/React_Native-0.81-61DAFB?style=for-the-badge&logo=react&logoColor=111111)](https://reactnative.dev/)
[![Socket.IO](https://img.shields.io/badge/Socket.IO-Live_Rides-010101?style=for-the-badge&logo=socket.io)](https://socket.io/)

</div>

## Experience

`NexGO-Passenger-App` is the rider-facing Expo app. It gives passengers the full trip flow: account setup, pickup planning, vehicle selection, live driver matching, active trip tracking, wallet actions, reviews, promotions, and support.

## Feature Grid

| Area | Capabilities |
| --- | --- |
| Account | Register, login, password reset OTP, profile updates |
| Ride | Pickup/drop-off, vehicle category, fare flow, ride confirmation |
| Live Trip | Nearby drivers, accepted ride state, driver location, arrival code |
| Money | Wallet balance, top-up flow, saved payment methods |
| Personalization | Saved addresses, profile image, membership area |
| Engagement | Promotions, driver public profile, reviews |
| Help | Support tickets and ticket history |

## Launch

```bash
npm install
cp .env.example .env
npm start
```

Set `.env`:

```env
EXPO_PUBLIC_API_URL=http://YOUR_LOCAL_IP:5000/api
```

Example:

```env
EXPO_PUBLIC_API_URL=http://192.168.1.20:5000/api
```

## Commands

| Command | Purpose |
| --- | --- |
| `npm start` | Open Expo dev server |
| `npm run android` | Launch Android target |
| `npm run ios` | Launch iOS target |
| `npm run web` | Launch web target |
| `npm run lint` | Run Expo linting |

## App Navigation

| Route | Screen |
| --- | --- |
| `/login` | Login and password reset |
| `/register` | Passenger registration |
| `/(tabs)/home` | Home dashboard |
| `/(tabs)/ride` | Ride planner and saved pickup addresses |
| `/confirm-route` | Driver matching and ride confirmation |
| `/active-ride/[id]` | Live active ride |
| `/ride-details/[id]` | Ride details |
| `/driver-profile/[id]` | Driver public profile |
| `/profile/*` | Wallet, support, reviews, addresses, details, privacy |

## Backend Contract

API base:

```text
http://<SERVER_HOST>:5000/api
```

Socket base:

```text
http://<SERVER_HOST>:5000
```

Main backend groups:

`/api/auth`, `/api/rides`, `/api/promotions`, `/api/reviews`, `/api/support-tickets`, `/api/upload`.

## Device Notes

- Start `NexGO-BackEnd` first.
- Physical phones need your computer LAN IP, not `localhost`.
- Keep `EXPO_PUBLIC_API_URL` ending with `/api`.
- Location permission powers pickup/drop-off and tracking.
- Photo library permission powers profile image selection.

