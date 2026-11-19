// Full playthrough with the keyboard only: every canvas step is focused and pressed with Enter.
// START_CHAPTER=n resumes from .tmp/recovery-play/checkpoint-n.json written by an earlier run.
import {runPlay} from './qa-play-flow.mjs';
await runPlay({input:'keyboard',output:'.tmp/recovery-play',defaultUrl:'http://127.0.0.1:4186'});
