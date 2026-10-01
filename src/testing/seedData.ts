/**
 * Demo dataset shared by every seeder (emulator/production via firebase-admin,
 * and the in-browser fake backend used for UI tests). Plain data + Dates only.
 */

export const DEMO_PASSWORD = 'Demo@1234'
export const DEMO_DOMAIN = 'demo.projectdesk.app'
const DAY = 24 * 60 * 60 * 1000

type Role = 'student' | 'faculty' | 'coordinator'

export interface SeedUser {
  uid: string
  name: string
  email: string
  role: Role
  status: 'active' | 'pending'
  department: string
  regNo?: string
  designation?: string
  teamId: string | null
}

export interface SeedFile {
  name: string
  url: string
  path: string
  size: number
  contentType: string
  provider: 'static'
}

export interface SeedComment {
  id: string
  authorId: string
  body: string
  kind: 'comment' | 'doubt'
  resolved: boolean
  at: Date
}

export interface SeedSubmission {
  id: string
  reviewId: string
  version: number
  title: string
  notes: string
  files: SeedFile[]
  submittedBy: string
  at: Date
  status: 'submitted' | 'changes_requested' | 'accepted'
  evaluation: { marks: number; remarks: string; by: string; at: Date } | null
  comments: SeedComment[]
}

export interface SeedAnnouncement {
  id: string
  title: string
  body: string
  audience: 'all' | 'students' | 'faculty'
  authorId: string
  at: Date
}

export interface SeedTeam {
  id: string
  name: string
  leadId: string
  memberIds: string[]
  guideId: string | null
  joinCode: string
  project: { title: string; abstract: string; domain: string; techStack: string[]; preferredGuideId?: string | null }
  proposalStatus: 'draft' | 'submitted' | 'approved' | 'changes_requested'
  proposalRemarks: string
  createdAt: Date
  submissions: SeedSubmission[]
  discussion: SeedComment[]
  activity: { id: string; type: string; actorId: string; message: string; at: Date }[]
}

const DEPT = 'Electronics and Communication Engineering'
const email = (local: string) => `${local}@${DEMO_DOMAIN}`

const PDF = 'application/pdf'
const PPTX = 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
const PNG = 'image/png'

const file = (name: string, contentType: string, size: number): SeedFile => ({
  name,
  url: `/samples/${name}`,
  path: `samples/${name}`,
  size,
  contentType,
  provider: 'static',
})

export function buildSeed(now = new Date()) {
  const at = (days: number, hours = 0) => new Date(now.getTime() + days * DAY + hours * 60 * 60 * 1000)

  const users: SeedUser[] = [
    { uid: 'coord-lakshmi', name: 'Dr. S. Lakshmi', email: email('coordinator'), role: 'coordinator', status: 'active', department: DEPT, designation: 'Professor & Project Coordinator', teamId: null },
    { uid: 'fac-meena', name: 'Dr. R. Meena', email: email('meena'), role: 'faculty', status: 'active', department: DEPT, designation: 'Associate Professor', teamId: null },
    { uid: 'fac-arvind', name: 'Prof. K. Arvind', email: email('arvind'), role: 'faculty', status: 'active', department: DEPT, designation: 'Assistant Professor', teamId: null },
    { uid: 'fac-kavitha', name: 'Dr. P. Kavitha', email: email('kavitha'), role: 'faculty', status: 'active', department: DEPT, designation: 'Assistant Professor', teamId: null },
    { uid: 'fac-prakash', name: 'J. Prakash', email: email('prakash'), role: 'faculty', status: 'pending', department: DEPT, designation: 'Assistant Professor', teamId: null },
  ]

  const students: [string, string, string, string | null][] = [
    ['stu-arjun', 'Arjun Ramesh', 'arjun', 'team-aurora'],
    ['stu-divya', 'Divya Krishnan', 'divya', 'team-aurora'],
    ['stu-karthik', 'Karthik Selvam', 'karthik', 'team-aurora'],
    ['stu-sneha', 'Sneha Balaji', 'sneha', 'team-aurora'],
    ['stu-harish', 'Harish Kumar', 'harish', 'team-nexus'],
    ['stu-priya', 'Priya Natarajan', 'priya', 'team-nexus'],
    ['stu-vignesh', 'Vignesh Murugan', 'vignesh', 'team-nexus'],
    ['stu-nandhini', 'Nandhini Ravi', 'nandhini', 'team-helix'],
    ['stu-surya', 'Surya Prakash', 'surya', 'team-helix'],
    ['stu-aishwarya', 'Aishwarya Mohan', 'aishwarya', 'team-orbit'],
    ['stu-rahul', 'Rahul Venkatesh', 'rahul', 'team-orbit'],
    ['stu-keerthana', 'Keerthana Siva', 'keerthana', 'team-orbit'],
    ['stu-mohammed', 'Mohammed Irfan', 'irfan', 'team-vertex'],
    ['stu-lavanya', 'Lavanya Sekar', 'lavanya', 'team-vertex'],
    ['stu-gokul', 'Gokul Anand', 'gokul', null],
    ['stu-meera', 'Meera Jayaraman', 'meera', null],
  ]
  students.forEach(([uid, name, local, teamId], i) =>
    users.push({
      uid,
      name,
      email: email(local),
      role: 'student',
      status: 'active',
      department: DEPT,
      regNo: `9100211060${String(i + 11).padStart(2, '0')}`,
      teamId,
    }),
  )

  const cycle = {
    id: 'cycle-2025-26',
    name: 'Final Year Project 2025-26',
    academicYear: '2025-26',
    department: DEPT,
    isActive: true,
    maxTeamSize: 4,
    createdBy: 'coord-lakshmi',
    createdAt: at(-75),
    reviews: [
      { id: 'r1', title: 'Review 1: Problem & literature survey', description: 'Problem statement, objectives, existing systems and a literature survey of at least 10 papers. Submit the review PPT.', maxMarks: 20, dueDate: at(-32) },
      { id: 'r2', title: 'Review 2: System design', description: 'Architecture diagram, module breakdown, data flow / UML diagrams and the tools you will use. Submit PPT and design document.', maxMarks: 20, dueDate: at(-3) },
      { id: 'r3', title: 'Review 3: Implementation progress', description: 'At least 60% of the implementation complete. Show working modules with screenshots and the updated PPT.', maxMarks: 25, dueDate: at(19) },
      { id: 'r4', title: 'Review 4: Final demo & report', description: 'Complete working demo, results and discussion, and the final project report (PDF) in the university format.', maxMarks: 35, dueDate: at(47) },
    ],
  }

  const teams: SeedTeam[] = [
    {
      id: 'team-aurora',
      name: 'Team Aurora',
      leadId: 'stu-arjun',
      memberIds: ['stu-arjun', 'stu-divya', 'stu-karthik', 'stu-sneha'],
      guideId: 'fac-meena',
      joinCode: 'AUR7K2',
      project: {
        title: 'Smart Irrigation using Soil-Moisture Sensing and LoRa',
        domain: 'IoT',
        techStack: ['ESP32', 'LoRa SX1278', 'Capacitive soil sensor', 'Firebase', 'Flutter'],
        abstract:
          'Small farms in Tamil Nadu still irrigate on a fixed schedule, wasting water during rain and under-watering in dry spells. We propose a low-power sensor network that measures soil moisture at root depth and sends readings over LoRa to a gateway up to 2 km away. The gateway switches the pump through a relay only when moisture drops below a crop-specific threshold, and a mobile app shows live readings and pump history. We expect a 30 to 40% reduction in water use compared to timer-based irrigation on a 1-acre test plot.',
      },
      proposalStatus: 'approved',
      proposalRemarks: 'Good scope. Please include a comparison with GSM-based systems in Review 1.',
      createdAt: at(-70),
      submissions: [
        {
          id: 'aurora-r1-v1', reviewId: 'r1', version: 1, title: 'Review 1: Literature survey',
          notes: 'Literature survey of 12 papers and the problem statement. Comparison with GSM-based systems is on slide 9.',
          files: [file('review1-literature-survey.pdf', PDF, 4169), file('review1-slides.pptx', PPTX, 32895)],
          submittedBy: 'stu-arjun', at: at(-33, -4), status: 'accepted',
          evaluation: { marks: 18, remarks: 'Well-organised survey. Cite the 2023 LoRaWAN field study as well.', by: 'fac-meena', at: at(-30) },
          comments: [
            { id: 'c1', authorId: 'fac-meena', body: 'Slide 6: the table of existing systems should include cost per node. That is your main argument.', kind: 'comment', resolved: false, at: at(-31) },
            { id: 'c2', authorId: 'stu-divya', body: 'Added the cost column, ma. We will carry it into the design review.', kind: 'comment', resolved: false, at: at(-31, 3) },
          ],
        },
        {
          id: 'aurora-r2-v1', reviewId: 'r2', version: 1, title: 'Review 2: System design',
          notes: 'Block diagram, sensor node circuit and the data flow between node, gateway and app.',
          files: [file('review2-system-design.pdf', PDF, 77194), file('architecture-diagram.png', PNG, 71337)],
          submittedBy: 'stu-arjun', at: at(-5), status: 'changes_requested',
          evaluation: { marks: 0, remarks: 'The gateway is missing from the block diagram, and there is no power budget for the sensor node. Please revise both and resubmit.', by: 'fac-meena', at: at(-4) },
          comments: [
            { id: 'c3', authorId: 'fac-meena', body: 'How long will the node run on 2×AA cells with a 15-minute reporting interval? Add the calculation.', kind: 'comment', resolved: false, at: at(-4, 1) },
            { id: 'c4', authorId: 'stu-karthik', body: 'Should the power budget include the LoRa transmit current at SF12, or is SF9 enough for 2 km in open field?', kind: 'doubt', resolved: true, at: at(-4, 3) },
            { id: 'c5', authorId: 'fac-meena', body: 'Show both. Use SF9 as the default and justify it with the link budget.', kind: 'comment', resolved: false, at: at(-4, 5) },
          ],
        },
        {
          id: 'aurora-r2-v2', reviewId: 'r2', version: 2, title: 'Review 2: revised design',
          notes: 'Added the gateway to the block diagram and a power budget (slide 11): ~14 months on 2×AA at SF9.',
          files: [file('review2-system-design-v2.pdf', PDF, 77692), file('architecture-diagram.png', PNG, 71337)],
          submittedBy: 'stu-divya', at: at(-1, -2), status: 'submitted', evaluation: null,
          comments: [],
        },
      ],
      discussion: [
        { id: 'd1', authorId: 'stu-sneha', body: 'Is the report format the same as last year (Anna University template, 1.5 spacing)?', kind: 'doubt', resolved: true, at: at(-20) },
        { id: 'd2', authorId: 'fac-meena', body: 'Yes, same template. I have shared it with Arjun. Please keep the chapter numbering as in the template.', kind: 'comment', resolved: false, at: at(-19) },
        { id: 'd3', authorId: 'stu-arjun', body: 'Field testing is planned for next Saturday at the college farm. Karthik is arranging the pump relay.', kind: 'comment', resolved: false, at: at(-2) },
        { id: 'd4', authorId: 'stu-karthik', body: 'Can we use a 12V DC pump for the demo instead of the 0.5 HP motor? The relay board is rated for 10A.', kind: 'doubt', resolved: false, at: at(-1) },
      ],
      activity: [
        { id: 'a1', type: 'team_created', actorId: 'stu-arjun', message: 'Arjun Ramesh created the team', at: at(-70) },
        { id: 'a2', type: 'member_joined', actorId: 'stu-divya', message: 'Divya Krishnan joined the team', at: at(-70, 2) },
        { id: 'a3', type: 'member_joined', actorId: 'stu-karthik', message: 'Karthik Selvam joined the team', at: at(-69) },
        { id: 'a4', type: 'member_joined', actorId: 'stu-sneha', message: 'Sneha Balaji joined the team', at: at(-69, 5) },
        { id: 'a5', type: 'guide_assigned', actorId: 'coord-lakshmi', message: 'Dr. S. Lakshmi assigned Dr. R. Meena as project guide', at: at(-66) },
        { id: 'a6', type: 'proposal_submitted', actorId: 'stu-arjun', message: 'Arjun Ramesh submitted the project proposal for approval', at: at(-64) },
        { id: 'a7', type: 'proposal_reviewed', actorId: 'fac-meena', message: 'Dr. R. Meena approved the project proposal', at: at(-62) },
        { id: 'a8', type: 'submission_created', actorId: 'stu-arjun', message: 'Arjun Ramesh submitted Review 1', at: at(-33, -4) },
        { id: 'a9', type: 'submission_evaluated', actorId: 'fac-meena', message: 'Dr. R. Meena accepted Review 1 with 18/20', at: at(-30) },
        { id: 'a10', type: 'submission_created', actorId: 'stu-arjun', message: 'Arjun Ramesh submitted Review 2', at: at(-5) },
        { id: 'a11', type: 'submission_evaluated', actorId: 'fac-meena', message: 'Dr. R. Meena requested changes on Review 2', at: at(-4) },
        { id: 'a12', type: 'submission_created', actorId: 'stu-divya', message: 'Divya Krishnan resubmitted Review 2 (v2)', at: at(-1, -2) },
      ],
    },
    {
      id: 'team-nexus',
      name: 'Team Nexus',
      leadId: 'stu-harish',
      memberIds: ['stu-harish', 'stu-priya', 'stu-vignesh'],
      guideId: 'fac-meena',
      joinCode: 'NXS4Q8',
      project: {
        title: 'Driver Drowsiness Detection using Eye Aspect Ratio',
        domain: 'Computer Vision',
        techStack: ['Raspberry Pi 4', 'OpenCV', 'dlib', 'Python'],
        abstract:
          'Driver fatigue causes a large share of highway accidents at night. This project uses a dashboard camera and facial landmark detection to compute the eye aspect ratio in real time. When the eyes stay closed beyond a threshold, the system sounds a buzzer and vibrates the seat. The whole pipeline runs on a Raspberry Pi 4 at 15 fps without cloud connectivity.',
      },
      proposalStatus: 'approved',
      proposalRemarks: '',
      createdAt: at(-68),
      submissions: [
        {
          id: 'nexus-r1-v1', reviewId: 'r1', version: 1, title: 'Review 1: Literature survey', notes: '',
          files: [file('review1-literature-survey.pdf', PDF, 4169)],
          submittedBy: 'stu-harish', at: at(-34), status: 'accepted',
          evaluation: { marks: 17, remarks: 'Good. Add the dataset you will use for testing.', by: 'fac-meena', at: at(-31) },
          comments: [],
        },
        {
          id: 'nexus-r2-v1', reviewId: 'r2', version: 1, title: 'Review 2: System design', notes: 'Includes the processing pipeline and timing analysis.',
          files: [file('review2-system-design.pdf', PDF, 77194), file('review1-slides.pptx', PPTX, 32895)],
          submittedBy: 'stu-priya', at: at(-6), status: 'accepted',
          evaluation: { marks: 16, remarks: 'Clear pipeline. Frame-rate analysis on slide 8 is useful.', by: 'fac-meena', at: at(-2) },
          comments: [],
        },
      ],
      discussion: [],
      activity: [
        { id: 'a1', type: 'team_created', actorId: 'stu-harish', message: 'Harish Kumar created the team', at: at(-68) },
        { id: 'a2', type: 'submission_evaluated', actorId: 'fac-meena', message: 'Dr. R. Meena accepted Review 2 with 16/20', at: at(-2) },
      ],
    },
    {
      id: 'team-helix',
      name: 'Team Helix',
      leadId: 'stu-nandhini',
      memberIds: ['stu-nandhini', 'stu-surya'],
      guideId: 'fac-arvind',
      joinCode: 'HLX9M3',
      project: {
        title: 'Blockchain-based Academic Certificate Verification',
        domain: 'Blockchain',
        techStack: ['Solidity', 'Hardhat', 'React', 'IPFS'],
        abstract:
          'Employers still verify degree certificates by writing to universities, which takes weeks. We propose issuing certificate hashes on a permissioned Ethereum network so that anyone can verify a certificate instantly by scanning a QR code, without exposing student data.',
      },
      proposalStatus: 'submitted',
      proposalRemarks: '',
      createdAt: at(-40),
      submissions: [],
      discussion: [],
      activity: [
        { id: 'a1', type: 'team_created', actorId: 'stu-nandhini', message: 'Nandhini Ravi created the team', at: at(-40) },
        { id: 'a2', type: 'proposal_submitted', actorId: 'stu-nandhini', message: 'Nandhini Ravi submitted the project proposal for approval', at: at(-2) },
      ],
    },
    {
      id: 'team-orbit',
      name: 'Team Orbit',
      leadId: 'stu-aishwarya',
      memberIds: ['stu-aishwarya', 'stu-rahul', 'stu-keerthana'],
      guideId: 'fac-arvind',
      joinCode: 'ORB2T6',
      project: {
        title: 'Indoor Air Quality Monitor with ESP32',
        domain: 'Embedded Systems',
        techStack: ['ESP32', 'SGP30', 'PMS5003', 'MQTT', 'Grafana'],
        abstract:
          'Classrooms and labs often have poor ventilation. This project builds a low-cost monitor that measures CO2-equivalent, VOCs and PM2.5, publishes readings over MQTT and alerts the lab in-charge when levels cross safe limits.',
      },
      proposalStatus: 'approved',
      proposalRemarks: '',
      createdAt: at(-66),
      submissions: [
        {
          id: 'orbit-r1-v1', reviewId: 'r1', version: 1, title: 'Review 1 submission', notes: '',
          files: [file('review1-slides.pptx', PPTX, 32895)],
          submittedBy: 'stu-aishwarya', at: at(-31), status: 'accepted',
          evaluation: { marks: 15, remarks: 'Submitted a day late. Survey needs more recent papers.', by: 'fac-arvind', at: at(-28) },
          comments: [],
        },
      ],
      discussion: [
        { id: 'd1', authorId: 'stu-rahul', body: 'Sir, the PMS5003 sensor is out of stock locally. Can we switch to SDS011?', kind: 'doubt', resolved: false, at: at(-3) },
      ],
      activity: [{ id: 'a1', type: 'team_created', actorId: 'stu-aishwarya', message: 'Aishwarya Mohan created the team', at: at(-66) }],
    },
    {
      id: 'team-vertex',
      name: 'Team Vertex',
      leadId: 'stu-mohammed',
      memberIds: ['stu-mohammed', 'stu-lavanya'],
      guideId: null,
      joinCode: 'VTX5H7',
      project: { title: 'Sign Language to Speech using CNN', domain: 'Machine Learning', techStack: ['TensorFlow', 'MediaPipe'], abstract: '', preferredGuideId: 'fac-kavitha' },
      proposalStatus: 'draft',
      proposalRemarks: '',
      createdAt: at(-12),
      submissions: [],
      discussion: [],
      activity: [{ id: 'a1', type: 'team_created', actorId: 'stu-mohammed', message: 'Mohammed Irfan created the team', at: at(-12) }],
    },
  ]

  const announcements: SeedAnnouncement[] = [
    {
      id: 'ann-r3-format',
      title: 'Review 3 slides: use the department template',
      body: 'Please use the updated department PPT template for Review 3. Keep it to 15 slides and add a demo video link on the last slide.',
      audience: 'students',
      authorId: 'coord-lakshmi',
      at: at(-2),
    },
    {
      id: 'ann-r2-marks',
      title: 'Review 2 marks due this week',
      body: 'Guides, please finish marking Review 2 by Friday so the internal marks can be sent to the exam cell.',
      audience: 'faculty',
      authorId: 'coord-lakshmi',
      at: at(-1),
    },
  ]

  return { users, cycle, teams, announcements }
}

export type Seed = ReturnType<typeof buildSeed>
