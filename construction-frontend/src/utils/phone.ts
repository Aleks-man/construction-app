const minPhoneDigits = 10;
const maxPhoneDigits = 15;
const allowedPhonePattern = /^\+?[\d\s().-]+$/;

export function isValidOptionalPhone(phone: string) {
  const trimmedPhone = phone.trim();

  if (!trimmedPhone) {
    return true;
  }

  const digitCount = trimmedPhone.replace(/\D/g, "").length;

  return (
    allowedPhonePattern.test(trimmedPhone) &&
    digitCount >= minPhoneDigits &&
    digitCount <= maxPhoneDigits
  );
}
