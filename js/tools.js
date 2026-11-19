/* Tool registry: add one entry to add a tool to the platform. status: 'live' | 'soon'. */
const ico = p => `<svg viewBox="0 0 24 24" aria-hidden="true">${p}</svg>`;
const TOOLS = [
    {
        id: 'penguin-stopwatch', name: 'Penguin Stopwatch', status: 'live', href: 'tools/penguin-stopwatch/index.html',
        desc: 'A smart study timer that helps students track study sessions, manage breaks, and monitor their study history.',
        icon: ico('<circle cx="12" cy="13.5" r="7.5"/><path d="M12 9.5v4l2.5 2M9.5 2.5h5"/>')
    },
    // { id: 'notes', name: 'Smart Notes', status: 'soon', desc: 'Organized, searchable notes for lectures, blocks and rotations.', icon: ico('<rect x="5" y="3" width="14" height="18" rx="2.5"/><path d="M9 8h6M9 12h6M9 16h3"/>') },
    // { id: 'flashcards', name: 'Flashcards', status: 'soon', desc: 'Spaced-repetition decks for the facts that need to stick.', icon: ico('<rect x="3" y="6" width="14" height="12" rx="2"/><path d="M7 3h12a2 2 0 0 1 2 2v10"/>') },
    // { id: 'planner', name: 'Study Planner', status: 'soon', desc: 'A calm weekly plan that balances study, rest and life.', icon: ico('<rect x="3.5" y="5" width="17" height="15" rx="2.5"/><path d="M8 3v4M16 3v4M3.5 10h17"/>') },
    // { id: 'countdown', name: 'Exam Countdown', status: 'soon', desc: 'Keep every upcoming exam in view without the stress.', icon: ico('<path d="M7 3h10M7 21h10M8 3c0 5 8 5 8 9s-8 4-8 9"/>') }
    // 
    ,{ id: 'library', name: 'Resource Library', status: 'live', href: 'student/resources.html',
        desc: 'Courses and lectures organized by your academic year, with a checklist to track your progress.', icon: ico('<path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v16H6.5A2.5 2.5 0 0 0 4 21.5zM4 18.5V5.5"/>') }
];