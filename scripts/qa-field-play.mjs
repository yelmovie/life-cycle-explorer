// Full playthrough with pointer taps where each canvas step is drawn, plus a real magnifier drag.
// START_CHAPTER=n resumes from .tmp/field-play/checkpoint-n.json written by an earlier run.
import {runPlay} from './qa-play-flow.mjs';
await runPlay({input:'pointer',output:'.tmp/field-play',defaultUrl:'http://127.0.0.1:4202'});
