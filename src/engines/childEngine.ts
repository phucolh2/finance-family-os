import type { TimelinePeriod } from '../types/finance';
import type { ChildCostOutput, ChildLifestyle } from '../types/child';
import { monthsBetween } from '../utils/date';
import { safeNumber } from '../utils/math';

export interface ChildEngineInput {
  period: TimelinePeriod;
  childBirthMonth?: number;
  childBirthYear?: number;
  lifestyle: ChildLifestyle;
  budgetCapMonthly?: number;
  educationInflationAnnual: number; // in percent, e.g. 6 for 6%
  healthInflationAnnual: number;    // in percent, e.g. 6 for 6%
  generalInflationAnnual: number;   // in percent, e.g. 4 for 4%
}

/**
 * Pure child cost calculator.
 * Computes monthly child cost components dynamically based on age and lifestyle.
 * Caps the total and applies compounding inflation over time.
 */
export function calculateChildCost(input: ChildEngineInput): ChildCostOutput {
  const inactiveOutput: ChildCostOutput = {
    isActive: false,
    food: 0,
    education: 0,
    englishSkills: 0,
    healthcare: 0,
    clothesSupplies: 0,
    travelExperience: 0,
    universityFund: 0,
    postGradSupport: 0,
    totalMonthly: 0,
    totalYearly: 0,
    notes: ['Con chưa chào đời.'],
  };

  const birthMonth = input.childBirthMonth;
  const birthYear = input.childBirthYear;
  if (!birthMonth || !birthYear) {
    return inactiveOutput;
  }

  const period = input.period;
  const monthsElapsed = monthsBetween(
    { year: birthYear, month: birthMonth },
    { year: period.year, month: period.month }
  );

  if (monthsElapsed < 0) {
    return inactiveOutput;
  }

  const childAge = Math.floor(monthsElapsed / 12);
  const yearsSinceBirth = childAge;

  // 1. Establish base cost components in VND Million based on comfortable/premium lifestyle at age bands
  let food = 0;
  let education = 0;
  let englishSkills = 0;
  let healthcare = 0;
  let clothesSupplies = 0;
  let travelExperience = 0;
  let universityFund = 0;
  let postGradSupport = 0;
  const notes: string[] = [`Con ${childAge} tuổi.`];

  if (childAge <= 2) {
    // Infant / Toddler
    food = 4;
    healthcare = 2;
    clothesSupplies = 3;
    travelExperience = 1;
    notes.push('Giai đoạn tã sữa sơ sinh.');
  } else if (childAge <= 5) {
    // Kindergarten
    food = 4;
    healthcare = 1.5;
    clothesSupplies = 2;
    travelExperience = 1.5;
    education = 5; // Mầm non tư thục
    englishSkills = 1;
    notes.push('Học mầm non chất lượng và làm quen tiếng Anh.');
  } else if (childAge <= 11) {
    // Primary School
    food = 5;
    healthcare = 1.5;
    clothesSupplies = 2;
    travelExperience = 2;
    education = 7; // Tiểu học tư thục
    englishSkills = 2.5;
    notes.push('Học tiểu học và phát triển kỹ năng ngoại ngữ.');
  } else if (childAge <= 17) {
    // High School
    food = 6;
    healthcare = 1.5;
    clothesSupplies = 2.5;
    travelExperience = 2.5;
    education = 9; // Trung học chất lượng cao
    englishSkills = 3.5;
    notes.push('Học phổ thông chất lượng cao.');
  } else if (childAge <= 21) {
    // University
    food = 6;
    healthcare = 1.5;
    clothesSupplies = 2.5;
    travelExperience = 2;
    education = 18; // Đại học trong nước chất lượng cao (không mặc định RMIT/du học)
    notes.push('Học đại học trong nước chất lượng cao.');
  } else if (childAge === 22) {
    postGradSupport = 10;
    notes.push('Hỗ trợ tài chính lập nghiệp năm 1.');
  } else if (childAge === 23) {
    postGradSupport = 7;
    notes.push('Hỗ trợ tài chính lập nghiệp năm 2.');
  } else if (childAge === 24) {
    postGradSupport = 5;
    notes.push('Hỗ trợ tài chính lập nghiệp năm 3.');
  } else {
    // Age 25+, independent
    return {
      isActive: true,
      childAge,
      food: 0,
      education: 0,
      englishSkills: 0,
      healthcare: 0,
      clothesSupplies: 0,
      travelExperience: 0,
      universityFund: 0,
      postGradSupport: 0,
      totalMonthly: 0,
      totalYearly: 0,
      notes: ['Con đã trưởng thành độc lập tài chính.'],
    };
  }

  // 2. Apply compounding inflation rates
  const eduInf = safeNumber(input.educationInflationAnnual, 0) / 100;
  const hlthInf = safeNumber(input.healthInflationAnnual, 0) / 100;
  const genInf = safeNumber(input.generalInflationAnnual, 0) / 100;

  education = education * Math.pow(1 + eduInf, yearsSinceBirth);
  englishSkills = englishSkills * Math.pow(1 + eduInf, yearsSinceBirth);
  healthcare = healthcare * Math.pow(1 + hlthInf, yearsSinceBirth);
  
  food = food * Math.pow(1 + genInf, yearsSinceBirth);
  clothesSupplies = clothesSupplies * Math.pow(1 + genInf, yearsSinceBirth);
  travelExperience = travelExperience * Math.pow(1 + genInf, yearsSinceBirth);
  postGradSupport = postGradSupport * Math.pow(1 + genInf, yearsSinceBirth);

  // 3. Sum raw monthly costs and apply lifestyle cap
  const rawTotalMonthly =
    food +
    education +
    englishSkills +
    healthcare +
    clothesSupplies +
    travelExperience +
    universityFund +
    postGradSupport;

  const cap = safeNumber(input.budgetCapMonthly, 35);
  let totalMonthly = rawTotalMonthly;

  if (rawTotalMonthly > cap) {
    totalMonthly = cap;
    notes.push(`Đã giới hạn chi phí theo ngân sách tối đa (${cap} tr/tháng).`);
  }

  return {
    isActive: true,
    childAge,
    food,
    education,
    englishSkills,
    healthcare,
    clothesSupplies,
    travelExperience,
    universityFund,
    postGradSupport,
    totalMonthly,
    totalYearly: totalMonthly * 12,
    notes,
  };
}
