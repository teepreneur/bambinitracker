-- ============================================================
-- Bambini Tracker: Milestone System v2
-- Based on CDC "Learn the Signs. Act Early." (2023 revision)
-- and WHO Motor Development Standards
-- Run this ENTIRE script in your Supabase SQL Editor
-- ============================================================

-- Step 1: Add age range columns to the catalog
ALTER TABLE public.milestones_catalog
  ADD COLUMN IF NOT EXISTS age_min_months INTEGER,
  ADD COLUMN IF NOT EXISTS age_max_months INTEGER,
  ADD COLUMN IF NOT EXISTS tip TEXT; -- Short parent tip for the milestone

-- Step 2: Update child_milestones to support status
ALTER TABLE public.child_milestones
  DROP CONSTRAINT IF EXISTS child_milestones_status_check;

ALTER TABLE public.child_milestones
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'achieved'
    CHECK (status IN ('not_yet', 'emerging', 'achieved'));

-- Step 3: Clear old placeholder data and seed fresh comprehensive milestones
TRUNCATE public.child_milestones;
TRUNCATE public.milestones_catalog CASCADE;

-- ============================================================
-- SEED DATA: 0–2 Months
-- ============================================================
INSERT INTO public.milestones_catalog (age_months, age_min_months, age_max_months, domain, title, description, tip) VALUES
-- Social
(2, 0, 3, 'Social', 'Social smile', 'Smiles when they see your face or hear your voice.', 'Smile and talk gently to your baby to encourage this.'),
(2, 0, 3, 'Social', 'Calms down with comfort', 'Stops crying or settles when picked up or spoken to softly.', 'Respond quickly to cries — this builds trust and attachment.'),

-- Language
(2, 0, 3, 'Language', 'Startles at sounds', 'Reacts to loud sounds with a startle or cry.', 'Observe if your baby reacts to a door slam or loud clap.'),
(2, 0, 3, 'Language', 'Makes cooing sounds', 'Makes "ooh" and "aah" vocal sounds when content.', 'Coo back at your baby to start early conversation.'),

-- Gross Motor
(2, 0, 3, 'Gross Motor', 'Lifts head during tummy time', 'Briefly lifts head up when placed on tummy.', 'Do short tummy time sessions several times a day.'),
(2, 0, 3, 'Gross Motor', 'Smooth arm/leg movements', 'Moves arms and legs in a smooth, not jerky, manner.', 'Watch during bath time or nappy changes.'),

-- Cognitive
(2, 0, 3, 'Cognitive', 'Watches faces', 'Focuses on your face and watches it as you move.', 'Hold your face about 20–30cm away so baby can focus.'),
(2, 0, 3, 'Cognitive', 'Follows movement with eyes', 'Tracks slow-moving objects from side to side (within a short range).', 'Move a brightly coloured toy slowly across their view.');

-- ============================================================
-- SEED DATA: 4 Months
-- ============================================================
INSERT INTO public.milestones_catalog (age_months, age_min_months, age_max_months, domain, title, description, tip) VALUES
(4, 3, 5, 'Social', 'Laughs', 'Makes laughing sounds when happy or playfully tickled.', 'Gentle tickles and funny faces can trigger those first laughs.'),
(4, 3, 5, 'Social', 'Looks at people talking', 'Turns head or eyes toward the person talking to them.', 'Talk to your baby during feeds and nappy changes.'),
(4, 3, 5, 'Language', 'Makes sounds when happy', 'Makes sounds to express joy or excitement.', 'Respond to their sounds to encourage communication.'),
(4, 3, 5, 'Language', 'Responds to voice', 'Turns toward the direction of familiar voices.', 'Call your baby''s name from different positions.'),
(4, 3, 5, 'Gross Motor', 'Holds head steady', 'Holds head upright and steady when held in a sitting position.', 'Support their chest during supervised sitting practice.'),
(4, 3, 5, 'Gross Motor', 'Pushes up on arms during tummy time', 'Lifts chest off the ground, supported by arms.', 'Place a toy in front to motivate arm pushing.'),
(4, 3, 5, 'Fine Motor', 'Reaches for objects', 'Reaches out toward dangling or offered toys.', 'Offer a rattle or toy just within reach.'),
(4, 3, 5, 'Fine Motor', 'Holds objects briefly', 'Grasps an object placed in hand and holds it for a moment.', 'Place a light toy in their palm.'),
(4, 3, 5, 'Cognitive', 'Follows moving objects with eyes', 'Tracks toys or people moving across their field of vision.', 'Slowly move a toy back and forth in front of them.'),
(4, 3, 5, 'Cognitive', 'Recognises familiar people', 'Shows excitement or calm when they see a familiar carer.', 'Involve grandparents and regular carers often.');

-- ============================================================
-- SEED DATA: 6 Months
-- ============================================================
INSERT INTO public.milestones_catalog (age_months, age_min_months, age_max_months, domain, title, description, tip) VALUES
(6, 5, 7, 'Social', 'Knows familiar faces', 'Recognises parents and carers; may seem cautious with strangers.', 'Let strangers approach slowly and give baby time to adjust.'),
(6, 5, 7, 'Social', 'Likes to play with others', 'Shows clear enjoyment when played with and cries when play stops.', 'Peek-a-boo and singing songs are great at this age.'),
(6, 5, 7, 'Language', 'Babbles consonant sounds', 'Makes sounds like "ma", "ba", "da" strung together.', 'Repeat their sounds back to them to encourage more.'),
(6, 5, 7, 'Language', 'Responds to name', 'Turns toward you when their name is called.', 'Use their name frequently in conversation.'),
(6, 5, 7, 'Gross Motor', 'Rolls tummy-to-back and back-to-tummy', 'Can roll over in both directions.', 'Always supervise on high surfaces — rolling can be sudden!'),
(6, 5, 7, 'Gross Motor', 'Begins to sit without support', 'Sits briefly without support for a few seconds.', 'Surround with cushions while they practice sitting.'),
(6, 5, 7, 'Fine Motor', 'Transfers objects hand-to-hand', 'Passes an object from one hand to the other.', 'Offer rattles and soft blocks.'),
(6, 5, 7, 'Fine Motor', 'Rakes objects toward self', 'Uses a raking hand motion to grab items on a surface.', 'Use soft, light objects on a flat surface.'),
(6, 5, 7, 'Cognitive', 'Explores with hands and mouth', 'Mouths objects to explore them; bangs them together.', 'Ensure all toys are safe for mouthing at this stage.'),
(6, 5, 7, 'Sensory', 'Responds to sounds around them', 'Looks or turns toward sounds made outside their view.', 'Use bells, rattles, or claps behind or beside them.');

-- ============================================================
-- SEED DATA: 9 Months
-- ============================================================
INSERT INTO public.milestones_catalog (age_months, age_min_months, age_max_months, domain, title, description, tip) VALUES
(9, 7, 10, 'Social', 'Is shy or nervous with strangers', 'Clearly prefers familiar faces and may cling to parent.', 'Give reassurance and don''t force interactions with strangers.'),
(9, 7, 10, 'Social', 'Has a favourite toy', 'Shows clear preference for a specific toy or object.', 'Let them pick which toys to play with during playtime.'),
(9, 7, 10, 'Language', 'Makes many different sounds', 'Strings syllables together like "mamama" or "bababa".', 'Name objects around the house as you go about your day.'),
(9, 7, 10, 'Language', 'Understands "no"', 'Briefly stops or pauses when told "no" in a firm tone.', 'Use "no" consistently for safety situations.'),
(9, 7, 10, 'Gross Motor', 'Sits without support', 'Sits steadily without needing hands for balance.', 'Great time for floor-based play.'),
(9, 7, 10, 'Gross Motor', 'Pulls to stand', 'Pulls themselves up to a standing position using furniture.', 'Ensure furniture is stable and secured to the wall.'),
(9, 7, 10, 'Gross Motor', 'Crawls', 'Moves forward on hands and knees (may also belly-crawl).', 'Create a safe, open floor space for exploration.'),
(9, 7, 10, 'Fine Motor', 'Pincer grasp', 'Picks up small items using thumb and index finger together.', 'Offer soft puffs or small pieces of food as fine motor practice.'),
(9, 7, 10, 'Cognitive', 'Object permanence', 'Looks for a toy even after it has been hidden from view.', 'Play peek-a-boo with toys, hiding under a cloth.'),
(9, 7, 10, 'Sensory', 'Explores textures', 'Touches and pats objects of different textures with curiosity.', 'Provide fabric swatches, foam, and other safe textures.');

-- ============================================================
-- SEED DATA: 12 Months
-- ============================================================
INSERT INTO public.milestones_catalog (age_months, age_min_months, age_max_months, domain, title, description, tip) VALUES
(12, 10, 14, 'Social', 'Waves hello or goodbye', 'Waves hand when someone waves to them or when leaving.', 'Wave when you enter and leave rooms consistently.'),
(12, 10, 14, 'Social', 'Plays simple games', 'Enjoys games like peek-a-boo, clapping games, and simple back-and-forth play.', 'Pat-a-cake and clapping songs are wonderful now.'),
(12, 10, 14, 'Language', 'Says "mama" or "dada" meaningfully', 'Uses "mama" or "dada" to call a specific person.', 'Respond enthusiastically when they call your name.'),
(12, 10, 14, 'Language', 'Says at least 1–2 words besides mama/dada', 'Has 1 or 2 clear words for regular things (e.g. "no", "up", "ball").', 'Name everything you do and touch throughout the day.'),
(12, 10, 14, 'Gross Motor', 'Walks holding onto furniture', 'Steps sideways while holding onto furniture for support.', 'Push sturdy furniture closer together to help them cruise.'),
(12, 10, 14, 'Gross Motor', 'May take first steps alone', 'Takes a few unsteady steps without holding on.', 'Stand a few steps away with arms outstretched to encourage.'),
(12, 10, 14, 'Fine Motor', 'Puts objects in a container', 'Places a ball or block into a cup or box intentionally.', 'Use a plastic bowl and toy blocks for this activity.'),
(12, 10, 14, 'Cognitive', 'Follows simple one-step instructions', 'Can follow a simple instruction e.g. "Give it to me" or "Come here".', 'Use simple, consistent language for daily routines.');

-- ============================================================
-- SEED DATA: 18 Months
-- ============================================================
INSERT INTO public.milestones_catalog (age_months, age_min_months, age_max_months, domain, title, description, tip) VALUES
(18, 15, 21, 'Social', 'Points to show interest', 'Points at objects or animals to show you something.', 'Follow their point and name what they''re looking at.'),
(18, 15, 21, 'Social', 'Hands objects to others', 'Gives toys or objects to a familiar adult spontaneously.', 'Request objects and say "thank you" when it''s given.'),
(18, 15, 21, 'Language', 'Says at least 10 words', 'Uses 10 or more recognisable words consistently.', 'Read picture books together daily to expand vocabulary.'),
(18, 15, 21, 'Language', 'Identifies body parts', 'Points to at least 1–2 body parts when named (e.g. nose, eyes).', 'Play "where''s your nose?" during play or baths.'),
(18, 15, 21, 'Gross Motor', 'Walks independently', 'Walks without support, though may be unsteady.', 'Encourage walking on different surfaces (grass, sand, carpet).'),
(18, 15, 21, 'Gross Motor', 'Climbs onto low furniture', 'Climbs onto a low chair or sofa with some effort.', 'Cushion the floor around climb areas for safety.'),
(18, 15, 21, 'Fine Motor', 'Scribbles with a crayon', 'Makes marks on paper when given a crayon or marker.', 'Offer chunky crayons on large paper for easy grip.'),
(18, 15, 21, 'Cognitive', 'Engages in simple pretend play', 'Pretends to do activities like feeding a doll or talking on a toy phone.', 'Provide simple props: a spoon, cup, or doll.'),
(18, 15, 21, 'Sensory', 'Explores messy play', 'Shows curiosity or enjoyment when touching sand, water, or food textures.', 'Let them explore safely supervised messy play.');

-- ============================================================
-- SEED DATA: 24 Months (2 years)
-- ============================================================
INSERT INTO public.milestones_catalog (age_months, age_min_months, age_max_months, domain, title, description, tip) VALUES
(24, 21, 27, 'Social', 'Plays alongside other children', 'Plays next to (not necessarily with) other children (parallel play).', 'Arrange playdates in a relaxed setting.'),
(24, 21, 27, 'Social', 'Shows defiant behaviour', 'Sometimes says "no" defiantly when asked to do something.', 'This is normal! Offer limited choices to give a sense of control.'),
(24, 21, 27, 'Language', 'Uses two-word phrases', 'Puts two words together like "more water" or "daddy go".', 'Expand on what they say: "Daddy go? Yes, daddy went to work!"'),
(24, 21, 27, 'Language', 'Points to pictures in a book', 'Points to the correct picture when asked "where is the dog?"', 'Use board books with clear pictures for daily reading.'),
(24, 21, 27, 'Gross Motor', 'Runs', 'Runs with a fairly steady gait, though may fall sometimes.', 'Let them run in safe, open outdoor spaces.'),
(24, 21, 27, 'Gross Motor', 'Kicks a ball', 'Kicks a stationary ball without falling over.', 'Use a large, light ball to start.'),
(24, 21, 27, 'Fine Motor', 'Turns pages of a book', 'Turns single pages of a board book.', 'Read together every day and let them help turn pages.'),
(24, 21, 27, 'Cognitive', 'Sorts shapes and colours', 'Matches or sorts simple shapes and colours.', 'Use a simple shape sorter toy.'),
(24, 21, 27, 'Sensory', 'Notices changes in environment', 'Reacts to noticeable changes (new furniture, different lights).', 'Narrate changes: "We have a new rug! It looks blue."');

-- ============================================================
-- SEED DATA: 36 Months (3 years)
-- ============================================================
INSERT INTO public.milestones_catalog (age_months, age_min_months, age_max_months, domain, title, description, tip) VALUES
(36, 30, 42, 'Social', 'Takes turns in games', 'Waits their turn during a simple back-and-forth game.', 'Board games like snakes and ladders teach turn-taking.'),
(36, 30, 42, 'Social', 'Shows affection for friends', 'Shows affection for playmates — hugs, holding hands.', 'Encourage kindness and affirm caring behaviour.'),
(36, 30, 42, 'Language', 'Uses 3–4 word sentences', 'Regularly uses 3–4 word phrases to communicate.', 'Have conversations during meals and car rides.'),
(36, 30, 42, 'Language', 'Strangers can understand 75% of speech', 'Most of what they say is understandable to unfamiliar adults.', 'If speech is unclear, speak to a health professional.'),
(36, 30, 42, 'Gross Motor', 'Rides a tricycle', 'Pedals and steers a tricycle or balance bike.', 'Start in a flat, safe outdoor space with supervision.'),
(36, 30, 42, 'Gross Motor', 'Climbs stairs alternating feet', 'Goes up stairs using alternating feet with limited support.', 'Hold their hand and count steps as they climb.'),
(36, 30, 42, 'Fine Motor', 'Draws a circle', 'Can copy or draw a rough circle.', 'Show them how to draw a circle, then let them try.'),
(36, 30, 42, 'Cognitive', 'Understands concept of "mine" vs "yours"', 'Grasps the idea of ownership of objects.', 'Narrate sharing situations clearly.'),
(36, 30, 42, 'Creative', 'Participates in imaginative play', 'Creates simple pretend scenarios (playing house, shop, school).', 'Join in with their stories and expand playfully.');

-- ============================================================
-- SEED DATA: 48 Months (4 years)
-- ============================================================
INSERT INTO public.milestones_catalog (age_months, age_min_months, age_max_months, domain, title, description, tip) VALUES
(48, 42, 54, 'Social', 'Prefers to play with other children', 'Actively seeks out and prefers playing with peers over alone.', 'Enrol in playgroups or preschool settings.'),
(48, 42, 54, 'Social', 'Cooperates with other children', 'Negotiates roles and shares in group play.', 'Praising cooperative play reinforces the behaviour.'),
(48, 42, 54, 'Language', 'Uses future tense', 'Uses "will" or "going to" to describe future events.', '"What are we going to do tomorrow?" — discuss plans.'),
(48, 42, 54, 'Language', 'Tells basic stories', 'Retells a story from a book or describes past events.', 'Ask "What happened in the story?" after reading together.'),
(48, 42, 54, 'Gross Motor', 'Hops on one foot', 'Hops several times on one foot.', 'Play hopscotch or follow-the-leader hopping games.'),
(48, 42, 54, 'Gross Motor', 'Catches a bounced ball', 'Catches a large ball that bounces up toward them.', 'Use a large, soft ball and bounce at chest height.'),
(48, 42, 54, 'Fine Motor', 'Cuts with scissors', 'Can cut along a straight line with child-safe scissors.', 'Start with thicker paper and short snipping motions.'),
(48, 42, 54, 'Cognitive', 'Understands time concepts', 'Understands "yesterday", "today", "tomorrow".', 'Use a simple visual daily calendar together.'),
(48, 42, 54, 'Creative', 'Draws a person with 4+ body parts', 'Draws a person with a head, body, arms, and legs.', 'Ask them to draw themselves or their family.');

-- ============================================================
-- SEED DATA: 60 Months (5 years)
-- ============================================================
INSERT INTO public.milestones_catalog (age_months, age_min_months, age_max_months, domain, title, description, tip) VALUES
(60, 54, 66, 'Social', 'Wants to please friends', 'Actively tries to make friends happy and shows awareness of their feelings.', 'Discuss feelings and empathy through stories.'),
(60, 54, 66, 'Social', 'Shows more independence', 'Capable of doing many activities without adult help.', 'Encourage them to dress themselves and tidy their space.'),
(60, 54, 66, 'Language', 'Speaks clearly in full sentences', 'Speech is generally clear and uses complete sentences.', 'If stuttering or unclear speech continues, consult a speech therapist.'),
(60, 54, 66, 'Language', 'Uses correct grammar most of the time', 'Uses past tense correctly (mostly) and complex sentences.', 'Read stories with varied sentence structures.'),
(60, 54, 66, 'Gross Motor', 'Skips', 'Skips with alternating feet.', 'Hold hands and skip together until they''ve got the rhythm.'),
(60, 54, 66, 'Gross Motor', 'Does a forward somersault', 'Can do a basic forward roll on a soft surface.', 'Use a gym mat and spot them carefully.'),
(60, 54, 66, 'Fine Motor', 'Writes some letters or numbers', 'Can write some letters from their name or numbers 1–5.', 'Alphabet tracing books are helpful at this age.'),
(60, 54, 66, 'Cognitive', 'Counts to 10+', 'Counts at least 10 objects accurately.', 'Count toys, steps, or snacks together every day.'),
(60, 54, 66, 'Creative', 'Draws detailed drawings', 'Adds details to drawings: clothes, fingers, backgrounds.', 'Let them draw freely and ask them to tell you about their picture.');

-- ============================================================
-- SEED DATA: 72 Months (6 years)
-- ============================================================
INSERT INTO public.milestones_catalog (age_months, age_min_months, age_max_months, domain, title, description, tip) VALUES
(72, 66, 78, 'Social', 'Has a best friend', 'Clearly identifies one or more close friends they prefer.', 'Support friendships by arranging playdates.'),
(72, 66, 78, 'Social', 'Understands fairness', 'Has a clear sense of rules and fairness in games.', 'Discuss rules and how to handle it fairly when someone cheats.'),
(72, 66, 78, 'Language', 'Reads simple words', 'Recognises and reads simple, familiar words.', 'Practice with simple phonics readers or early reading apps.'),
(72, 66, 78, 'Language', 'Can retell a story in order', 'Retells a familiar story with a clear beginning, middle, and end.', 'Ask "what happened first? Then what?"'),
(72, 66, 78, 'Gross Motor', 'Rides a bicycle with training wheels', 'Pedals steadily on a bicycle with stabilisers.', 'Practice on smooth flat surfaces. Helmet is essential!'),
(72, 66, 78, 'Gross Motor', 'Kicks ball with accuracy', 'Aims and kicks a ball with reasonable accuracy toward a target.', 'Set up cones or a simple goal to kick toward.'),
(72, 66, 78, 'Fine Motor', 'Draws detailed recognisable scenes', 'Creates pictures with multiple identifiable elements (house, sun, people).', 'Look at their art with genuine interest and ask questions.'),
(72, 66, 78, 'Cognitive', 'Plans simple activities', 'Can plan and execute a simple multi-step activity independently.', 'Let them plan a simple activity like building a fort.'),
(72, 66, 78, 'Creative', 'Writes simple sentences', 'Writes a simple sentence with correct punctuation.', 'Give them a simple journal to write or draw in each day.');
