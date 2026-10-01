// 10 MB matches the Cloudinary free plan limit for images, PDFs and raw files.
export const MAX_FILE_SIZE = 10 * 1024 * 1024
export const MAX_FILES_PER_SUBMISSION = 6

/** MIME types accepted for review submissions (reports, slides, screenshots). */
export const ACCEPTED_FILE_TYPES: Record<string, string> = {
  'application/pdf': 'PDF',
  'application/vnd.ms-powerpoint': 'PPT',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'PPTX',
  'application/msword': 'DOC',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'DOCX',
  'image/png': 'PNG',
  'image/jpeg': 'JPG',
  'image/webp': 'WEBP',
}

export const ACCEPT_ATTRIBUTE = [
  ...Object.keys(ACCEPTED_FILE_TYPES),
  '.pdf',
  '.ppt',
  '.pptx',
  '.doc',
  '.docx',
  '.png',
  '.jpg',
  '.jpeg',
  '.webp',
].join(',')

export const DEFAULT_REVIEWS = [
  {
    id: 'r1',
    title: 'Review 1: Problem & literature survey',
    description:
      'Problem statement, objectives, existing systems and a literature survey of at least 10 papers. Submit the review PPT.',
    maxMarks: 20,
    offsetDays: 21,
  },
  {
    id: 'r2',
    title: 'Review 2: System design',
    description:
      'Architecture diagram, module breakdown, data flow / UML diagrams and the tools you will use. Submit PPT and design document.',
    maxMarks: 20,
    offsetDays: 42,
  },
  {
    id: 'r3',
    title: 'Review 3: Implementation progress',
    description:
      'At least 60% of the implementation complete. Show working modules with screenshots and the updated PPT.',
    maxMarks: 25,
    offsetDays: 70,
  },
  {
    id: 'r4',
    title: 'Review 4: Final demo & report',
    description:
      'Complete working demo, results and discussion, and the final project report (PDF) in the university format.',
    maxMarks: 35,
    offsetDays: 98,
  },
] as const

export const DEPARTMENTS = [
  'Computer Science and Engineering',
  'Information Technology',
  'Electronics and Communication Engineering',
  'Electrical and Electronics Engineering',
  'Mechanical Engineering',
] as const
