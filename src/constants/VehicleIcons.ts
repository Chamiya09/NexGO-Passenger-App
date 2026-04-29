// d:\Project\GitHub Project\NexGO\NexGO-Passenger-App\src\constants\VehicleIcons.ts
// Maps vehicle categories to map marker assets

export const VehicleIcons: Record<string, { uri: string }> = {
    Bike: { uri: 'https://cdn-icons-png.flaticon.com/128/3721/3721619.png' }, // Bike icon
    Tuk: { uri: 'https://cdn-icons-png.flaticon.com/128/1822/1822216.png' }, // Tuk icon
    TukTuk: { uri: 'https://cdn-icons-png.flaticon.com/128/1822/1822216.png' }, // Legacy Tuk icon
    Mini: { uri: 'https://cdn-icons-png.flaticon.com/128/3202/3202926.png' }, // Car icon
    Car: { uri: 'https://cdn-icons-png.flaticon.com/128/3202/3202926.png' }, // Car icon
    Sedan: { uri: 'https://cdn-icons-png.flaticon.com/128/3202/3202926.png' }, // Car icon
    Van: { uri: 'https://cdn-icons-png.flaticon.com/128/3202/3202926.png' }, // Van icon
};

/* 
 * NOTE: For local assets (as specified in prompt: bike_icon.png, tuk_icon.png, car_icon.png), 
 * once you drop them into your frontend assets folder, you can replace the above map with:
 * 
 * export const VehicleIcons: Record<string, any> = {
 *   Bike: require('../../assets/images/bike_icon.png'),
 *   Tuk: require('../../assets/images/tuk_icon.png'),
 *   TukTuk: require('../../assets/images/tuk_icon.png'),
 *   Mini: require('../../assets/images/car_icon.png'),
 *   Car: require('../../assets/images/car_icon.png'),
 *   Sedan: require('../../assets/images/car_icon.png'),
 *   Van: require('../../assets/images/car_icon.png'),
 * };
 */
