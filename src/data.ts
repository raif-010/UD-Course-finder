/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { AccountRecord } from './types';

// Hardcoded courses list to generate realistic items
const COURSE_TEMPLATES = [
  {
    courses: [
      "HSC ICT Full Course [HSC'27] New Batch",
      "HSC Bangla-English Full Course [HSC'27] New Batch",
      "HSC Biology Full Course"
    ]
  },
  {
    courses: [
      "HSC Biology 27 Master Class",
      "HSC Chemistry 27 Crack Course"
    ]
  },
  {
    courses: [
      "HSC Chemistry 27 Crack Course",
      "HSC Physics 27 Advanced Batch"
    ]
  },
  {
    courses: [
      "ICT Full Admission Program",
      "HSC Bangla-English Full Course [HSC'26] Premium"
    ]
  },
  {
    courses: [
      "Biology 26 Crash Course",
      "Chemistry 26 Turbo Batch"
    ]
  }
];

export function generateDefaultRecords(): AccountRecord[] {
  const records: AccountRecord[] = [];
  
  // Seed state with some explicit premium records matching reference
  records.push({
    id: "3983372",
    password: "3983372",
    courses: [
      "HSC ICT Full Course [HSC'27] New Batch",
      "HSC Bangla-English Full Course [HSC'27] New Batch",
      "HSC Biology Full Course"
    ]
  });

  records.push({
    id: "3985313",
    password: "3985313",
    courses: [
      "HSC ICT Full Course [HSC'26] New Batch",
      "ICT Full Admission Program"
    ]
  });

  records.push({
    id: "3987644",
    password: "password_3987644",
    courses: [
      "HSC Biology 27 Master Class"
    ]
  });

  records.push({
    id: "3989121",
    password: "password_3989121",
    courses: [
      "HSC Chemistry 27 Crack Course",
      "HSC Physics 27 Advanced Batch"
    ]
  });

  // Generate the rest up to 12458 rows
  const targetRows = 12458;

  for (let i = records.length; i < targetRows; i++) {
    const templateIndex = (i * 17) % COURSE_TEMPLATES.length;
    const template = COURSE_TEMPLATES[templateIndex];
    // Generate IDs that match reference pattern (7-digit starting with 398)
    const idNum = 3980000 + ((i * 139) % 20000);
    const id = idNum.toString();
    
    records.push({
      id,
      password: `password_${id}`,
      courses: [...template.courses],
    });
  }

  return records;
}

export const RECENT_SEARCHES_LIST = [
  "HSC 27 ICT",
  "Biology 27",
  "Bangla English",
  "ICT Full",
  "Chemistry 27"
];
