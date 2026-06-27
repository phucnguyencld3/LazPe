export interface ValidationResult {
  isValid: boolean;
  message?: string;
}

/**
 * Kiểm tra tính hợp lệ của cân nặng, chiều cao của bé dựa trên khoảng tham chiếu WHO
 * Các giới hạn này được nới lỏng hơn khoảng -3SD đến +3SD một chút để không cản trở
 * các trường hợp ngoại lệ thực tế, nhưng vẫn chặn những dữ liệu quá vô lý (vd: 1 tháng 25kg).
 */
export function validateBabyGrowth(
  gender: string | null,
  ageInMonths: number,
  weightKg: number | null,
  heightCm: number | null
): ValidationResult {
  if (ageInMonths < 0) {
    return { isValid: false, message: "Ngày sinh không được ở tương lai." };
  }

  // Nếu người dùng không nhập thì hợp lệ
  if (!weightKg && !heightCm) {
    return { isValid: true };
  }

  let minWeight = 1.0;
  let maxWeight = 5.0;
  let minHeight = 35.0;
  let maxHeight = 60.0;

  // Xác định khoảng an toàn theo độ tuổi (tháng)
  if (ageInMonths <= 1) { // 0 - 1 tháng
    minWeight = 1.5; maxWeight = 7.0;
    minHeight = 40.0; maxHeight = 65.0;
  } else if (ageInMonths <= 3) {
    minWeight = 3.0; maxWeight = 9.0;
    minHeight = 50.0; maxHeight = 70.0;
  } else if (ageInMonths <= 6) {
    minWeight = 4.0; maxWeight = 12.0;
    minHeight = 55.0; maxHeight = 78.0;
  } else if (ageInMonths <= 12) { // 1 tuổi
    minWeight = 6.0; maxWeight = 15.0;
    minHeight = 65.0; maxHeight = 88.0;
  } else if (ageInMonths <= 24) { // 2 tuổi
    minWeight = 8.0; maxWeight = 20.0;
    minHeight = 75.0; maxHeight = 100.0;
  } else if (ageInMonths <= 36) { // 3 tuổi
    minWeight = 10.0; maxWeight = 25.0;
    minHeight = 85.0; maxHeight = 110.0;
  } else if (ageInMonths <= 48) { // 4 tuổi
    minWeight = 11.0; maxWeight = 30.0;
    minHeight = 90.0; maxHeight = 120.0;
  } else if (ageInMonths <= 60) { // 5 tuổi
    minWeight = 12.0; maxWeight = 35.0;
    minHeight = 95.0; maxHeight = 130.0;
  } else if (ageInMonths <= 84) { // 7 tuổi
    minWeight = 15.0; maxWeight = 45.0;
    minHeight = 105.0; maxHeight = 145.0;
  } else if (ageInMonths <= 120) { // 10 tuổi
    minWeight = 20.0; maxWeight = 60.0;
    minHeight = 120.0; maxHeight = 160.0;
  } else if (ageInMonths <= 180) { // 15 tuổi
    minWeight = 30.0; maxWeight = 90.0;
    minHeight = 140.0; maxHeight = 190.0;
  } else { // Trẻ > 15 tuổi
    minWeight = 35.0; maxWeight = 120.0;
    minHeight = 145.0; maxHeight = 200.0;
  }

  // Điều chỉnh nhẹ dựa trên giới tính (Bé trai thường nhỉnh hơn bé gái một chút)
  if (gender === 'Girl' || gender === 'Nữ') {
    maxWeight *= 0.95;
    maxHeight *= 0.98;
  } else if (gender === 'Boy' || gender === 'Nam') {
    maxWeight *= 1.05;
    maxHeight *= 1.02;
  }

  if (weightKg !== null && weightKg > 0) {
    if (weightKg < minWeight || weightKg > maxWeight) {
      return {
        isValid: false,
        message: `Cân nặng ${weightKg}kg đối với bé ${ageInMonths} tháng tuổi có vẻ không hợp lý (chuẩn ước tính: ${minWeight.toFixed(1)}kg - ${maxWeight.toFixed(1)}kg). Vui lòng kiểm tra lại.`,
      };
    }
  }

  if (heightCm !== null && heightCm > 0) {
    if (heightCm < minHeight || heightCm > maxHeight) {
      return {
        isValid: false,
        message: `Chiều cao ${heightCm}cm đối với bé ${ageInMonths} tháng tuổi có vẻ không hợp lý (chuẩn ước tính: ${minHeight.toFixed(1)}cm - ${maxHeight.toFixed(1)}cm). Vui lòng kiểm tra lại.`,
      };
    }
  }

  return { isValid: true };
}
