/* Gard Co-op Mega/Primal Visual Sync v1.
 * Extends *existing* player frame snapshots with optional form & shiny fields (indices 20 & 21).
 * No new network messages, Firebase writes, gameplay-stat changes, or save migrations.
 * Protocol supports mixed versions: older clients ignore extra tuple fields.
 */
(() => {
  'use strict';
  if (window.PS_COOP_MEGA_SYNC) return;
  const E = window.PS_HOOPA_ENGINE;
  const B = window.PS_MEGA_BRIDGE_V5;
  const FALLBACK_META = {"6-mega-x":{"s":2,"a":{"Idle":{"w":48,"h":56,"n":4,"r":8,"d":[15,15,15,15],"ax":23.5,"ay":31.5},"Walk":{"w":48,"h":56,"n":4,"r":8,"d":[8,10,8,10],"ax":23.5,"ay":31.5},"Attack":{"w":88,"h":96,"n":14,"r":8,"d":[2,2,2,2,4,1,1,2,2,2,2,2,2,2],"ax":43.5,"ay":50.5},"Shoot":{"w":56,"h":64,"n":11,"r":8,"d":[4,6,2,2,2,2,2,2,2,2,2],"ax":27.5,"ay":34.5},"Charge":{"w":48,"h":56,"n":10,"r":8,"d":[2,2,2,2,2,2,2,2,2,2],"ax":24.5,"ay":31.5},"Hurt":{"w":64,"h":64,"n":2,"r":8,"d":[2,8],"ax":31.5,"ay":33.5},"Faint":{"w":64,"h":64,"n":2,"r":8,"d":[2,8],"ax":31.5,"ay":33.5}},"sh":1,"sa":{"Idle":{"w":48,"h":48,"n":4,"r":8,"d":[15,15,15,15],"ax":23.5,"ay":27.5},"Walk":{"w":48,"h":48,"n":4,"r":8,"d":[8,10,8,10],"ax":23.5,"ay":27.5},"Attack":{"w":80,"h":88,"n":14,"r":8,"d":[2,2,2,2,4,1,1,2,2,2,2,2,2,2],"ax":39.5,"ay":46.5},"Charge":{"w":48,"h":48,"n":10,"r":8,"d":[2,2,2,2,2,2,2,2,2,2],"ax":24.5,"ay":27.5}}},"65-mega":{"s":1,"a":{"Idle":{"w":40,"h":64,"n":8,"r":8,"d":[6,6,6,6,6,6,6,6],"ax":19.5,"ay":35.5},"Walk":{"w":40,"h":64,"n":8,"r":8,"d":[8,10,8,10,8,10,8,10],"ax":19.5,"ay":35.5},"Attack":{"w":80,"h":96,"n":11,"r":8,"d":[4,2,4,1,1,1,2,2,2,2,4],"ax":39.5,"ay":51.5},"Shoot":{"w":40,"h":72,"n":12,"r":8,"d":[2,2,4,6,2,2,2,2,2,2,2,4],"ax":19.5,"ay":39.5},"Charge":{"w":40,"h":64,"n":10,"r":8,"d":[2,2,2,2,2,2,2,2,2,2],"ax":20.5,"ay":35.5},"Hurt":{"w":48,"h":72,"n":2,"r":8,"d":[2,8],"ax":23.5,"ay":36.5},"Faint":{"w":48,"h":72,"n":2,"r":8,"d":[2,8],"ax":23.5,"ay":36.5}},"sh":1},"80-mega":{"s":1,"a":{"Idle":{"w":32,"h":64,"n":5,"r":8,"d":[40,4,2,6,6],"ax":15.5,"ay":35.5},"Walk":{"w":48,"h":64,"n":8,"r":8,"d":[6,6,10,4,4,4,6,8],"ax":23.5,"ay":35.5},"Attack":{"w":80,"h":96,"n":14,"r":8,"d":[2,2,6,1,1,2,2,2,2,2,2,2,2,2],"ax":38.5,"ay":51.5},"Shoot":{"w":32,"h":56,"n":10,"r":8,"d":[2,2,2,2,2,2,2,2,2,2],"ax":16.5,"ay":31.5},"Charge":{"w":32,"h":56,"n":10,"r":8,"d":[2,2,2,2,2,2,2,2,2,2],"ax":16.5,"ay":31.5},"Hurt":{"w":32,"h":64,"n":5,"r":8,"d":[40,4,2,6,6],"ax":15.5,"ay":35.5},"Faint":{"w":32,"h":64,"n":5,"r":8,"d":[40,4,2,6,6],"ax":15.5,"ay":35.5}},"sh":1},"94-mega":{"s":2,"a":{"Idle":{"w":40,"h":40,"n":8,"r":8,"d":[40,4,3,3,3,3,3,4],"ax":19.5,"ay":23.5},"Walk":{"w":40,"h":40,"n":4,"r":8,"d":[8,10,8,10],"ax":19.5,"ay":23.5},"Attack":{"w":80,"h":80,"n":11,"r":8,"d":[4,2,4,1,1,1,2,2,2,2,4],"ax":39.5,"ay":43.5},"Shoot":{"w":64,"h":64,"n":12,"r":8,"d":[2,4,1,1,10,2,2,2,2,2,2,2],"ax":31.5,"ay":32.5},"Charge":{"w":48,"h":40,"n":10,"r":8,"d":[2,2,2,2,2,2,2,2,2,2],"ax":24.5,"ay":23.5},"Hurt":{"w":48,"h":48,"n":2,"r":8,"d":[2,8],"ax":23.5,"ay":25.5},"Faint":{"w":48,"h":48,"n":2,"r":8,"d":[2,8],"ax":23.5,"ay":25.5}},"sh":1},"115-mega":{"s":2,"a":{"Idle":{"w":40,"h":56,"n":5,"r":8,"d":[30,3,4,3,20],"ax":19.5,"ay":31.5},"Walk":{"w":40,"h":56,"n":4,"r":8,"d":[16,10,16,10],"ax":19.5,"ay":31.5},"Attack":{"w":72,"h":96,"n":13,"r":8,"d":[1,2,3,2,1,1,1,1,2,2,2,2,2],"ax":35.5,"ay":51.5},"Shoot":{"w":48,"h":56,"n":16,"r":8,"d":[2,1,1,1,1,1,6,2,2,2,2,2,2,2,2,2],"ax":23.5,"ay":30.5},"Charge":{"w":32,"h":48,"n":10,"r":8,"d":[2,2,2,2,2,2,2,2,2,2],"ax":16.5,"ay":27.5},"Hurt":{"w":40,"h":64,"n":2,"r":8,"d":[2,8],"ax":19.5,"ay":33.5},"Faint":{"w":40,"h":64,"n":2,"r":8,"d":[2,8],"ax":19.5,"ay":33.5}},"sh":1},"142-mega":{"s":1,"a":{"Idle":{"w":40,"h":64,"n":8,"r":8,"d":[8,8,8,8,8,8,8,8],"ax":19.5,"ay":35.5},"Walk":{"w":40,"h":64,"n":4,"r":8,"d":[8,8,8,8],"ax":19.5,"ay":35.5},"Attack":{"w":72,"h":80,"n":13,"r":8,"d":[2,2,6,1,2,2,2,2,2,2,2,2,2],"ax":35.5,"ay":43.5},"Shoot":{"w":56,"h":72,"n":12,"r":8,"d":[2,2,6,1,1,2,2,2,2,2,2,2],"ax":27.5,"ay":38.5},"Charge":{"w":40,"h":64,"n":10,"r":8,"d":[2,2,2,2,2,2,2,2,2,2],"ax":20.5,"ay":35.5},"Hurt":{"w":40,"h":72,"n":2,"r":8,"d":[2,8],"ax":19.5,"ay":37.5},"Faint":{"w":40,"h":72,"n":2,"r":8,"d":[2,8],"ax":19.5,"ay":37.5}},"sh":1},"150-mega-y":{"s":1,"a":{"Idle":{"w":48,"h":56,"n":8,"r":8,"d":[20,15,12,12,12,15,12,15],"ax":23.5,"ay":34.5},"Walk":{"w":40,"h":56,"n":6,"r":8,"d":[12,8,8,12,8,8],"ax":20.5,"ay":31.5},"Attack":{"w":80,"h":88,"n":11,"r":8,"d":[2,3,4,1,1,1,2,2,2,2,2],"ax":39.5,"ay":46.5},"Shoot":{"w":48,"h":56,"n":9,"r":8,"d":[3,5,5,5,5,5,5,5,3],"ax":19.5,"ay":31.5},"Charge":{"w":40,"h":56,"n":10,"r":8,"d":[4,4,4,4,4,4,4,4,4,4],"ax":20.5,"ay":32.5},"Hurt":{"w":48,"h":64,"n":2,"r":8,"d":[2,8],"ax":22.5,"ay":30.5},"Faint":{"w":48,"h":64,"n":2,"r":8,"d":[2,8],"ax":22.5,"ay":30.5}},"sh":1},"208-mega":{"s":2,"a":{"Idle":{"w":64,"h":136,"n":4,"r":8,"d":[16,12,16,12],"ax":31.5,"ay":71.5},"Walk":{"w":72,"h":128,"n":4,"r":8,"d":[10,14,10,14],"ax":35.5,"ay":67.5},"Attack":{"w":120,"h":176,"n":11,"r":8,"d":[2,6,1,1,1,2,2,2,2,2,2],"ax":59.5,"ay":90.5},"Shoot":{"w":96,"h":136,"n":12,"r":8,"d":[2,2,6,2,2,2,2,2,2,2,2,2],"ax":47.5,"ay":69.5},"Charge":{"w":64,"h":128,"n":10,"r":8,"d":[2,2,2,2,2,2,2,2,2,2],"ax":32.5,"ay":67.5},"Hurt":{"w":64,"h":128,"n":2,"r":8,"d":[2,8],"ax":31.5,"ay":65.5},"Faint":{"w":64,"h":128,"n":2,"r":8,"d":[2,8],"ax":31.5,"ay":65.5}},"sh":1},"227-mega":{"s":1,"a":{"Idle":{"w":48,"h":72,"n":7,"r":8,"d":[40,4,4,4,4,4,4],"ax":23.5,"ay":39.5},"Walk":{"w":48,"h":80,"n":9,"r":8,"d":[4,4,4,4,8,8,8,8,8],"ax":23.5,"ay":43.5},"Attack":{"w":88,"h":96,"n":14,"r":8,"d":[3,3,3,3,3,2,2,3,3,3,3,3,8,2],"ax":43.5,"ay":50.5},"Shoot":{"w":48,"h":64,"n":8,"r":8,"d":[3,6,6,3,3,3,10,3],"ax":23.5,"ay":35.5},"Charge":{"w":48,"h":56,"n":10,"r":8,"d":[2,2,2,2,2,2,2,2,2,2],"ax":23.5,"ay":31.5},"Hurt":{"w":48,"h":80,"n":2,"r":8,"d":[2,8],"ax":23.5,"ay":41.5},"Faint":{"w":48,"h":80,"n":2,"r":8,"d":[2,8],"ax":23.5,"ay":41.5}}},"229-mega":{"s":1,"a":{"Idle":{"w":40,"h":64,"n":14,"r":8,"d":[60,10,2,2,2,2,2,2,2,2,2,2,2,10],"ax":19.5,"ay":35.5},"Walk":{"w":40,"h":64,"n":4,"r":8,"d":[8,12,8,12],"ax":19.5,"ay":35.5},"Attack":{"w":64,"h":88,"n":10,"r":8,"d":[2,4,1,1,1,2,2,2,2,2],"ax":31.5,"ay":46.5},"Shoot":{"w":48,"h":64,"n":12,"r":8,"d":[6,2,6,1,1,2,2,2,2,2,2,2],"ax":23.5,"ay":33.5},"Charge":{"w":40,"h":64,"n":10,"r":8,"d":[2,2,2,2,2,2,2,2,2,2],"ax":20.5,"ay":35.5},"Hurt":{"w":48,"h":64,"n":2,"r":8,"d":[2,8],"ax":23.5,"ay":31.5},"Faint":{"w":48,"h":64,"n":2,"r":8,"d":[2,8],"ax":23.5,"ay":31.5}},"sh":1},"248-mega":{"s":1,"a":{"Idle":{"w":40,"h":56,"n":4,"r":8,"d":[14,24,14,24],"ax":19.5,"ay":31.5},"Walk":{"w":40,"h":56,"n":4,"r":8,"d":[10,16,10,16],"ax":19.5,"ay":31.5},"Attack":{"w":64,"h":88,"n":11,"r":8,"d":[2,2,4,1,2,2,2,2,2,2,2],"ax":31.5,"ay":46.5},"Shoot":{"w":48,"h":56,"n":13,"r":8,"d":[2,3,6,1,2,2,2,2,2,2,2,2,2],"ax":23.5,"ay":29.5},"Charge":{"w":40,"h":48,"n":10,"r":8,"d":[2,2,2,2,2,2,2,2,2,2],"ax":20.5,"ay":27.5},"Hurt":{"w":48,"h":56,"n":2,"r":8,"d":[2,8],"ax":23.5,"ay":31.5},"Faint":{"w":48,"h":56,"n":2,"r":8,"d":[2,8],"ax":23.5,"ay":31.5}}},"282-mega":{"s":1,"a":{"Idle":{"w":32,"h":48,"n":4,"r":8,"d":[6,12,6,12],"ax":15.5,"ay":27.5},"Walk":{"w":32,"h":40,"n":4,"r":8,"d":[8,12,8,12],"ax":15.5,"ay":23.5},"Attack":{"w":72,"h":80,"n":10,"r":8,"d":[2,4,1,1,1,2,2,2,2,2],"ax":35.5,"ay":42.5},"Shoot":{"w":32,"h":48,"n":10,"r":8,"d":[2,2,2,2,2,2,2,2,2,2],"ax":16.5,"ay":27.5},"Charge":{"w":32,"h":48,"n":10,"r":8,"d":[2,2,2,2,2,2,2,2,2,2],"ax":16.5,"ay":27.5},"Hurt":{"w":40,"h":56,"n":2,"r":8,"d":[2,8],"ax":19.5,"ay":30.5},"Faint":{"w":40,"h":56,"n":2,"r":8,"d":[2,8],"ax":19.5,"ay":30.5}},"sh":1},"302-mega":{"s":2,"a":{"Idle":{"w":40,"h":56,"n":2,"r":8,"d":[40,20],"ax":19.5,"ay":31.5},"Walk":{"w":32,"h":56,"n":4,"r":8,"d":[6,8,6,8],"ax":15.5,"ay":31.5},"Attack":{"w":72,"h":96,"n":10,"r":8,"d":[2,6,1,1,1,2,2,2,2,2],"ax":35.5,"ay":50.5},"Shoot":{"w":40,"h":64,"n":10,"r":8,"d":[2,2,2,2,2,2,2,2,2,2],"ax":20.5,"ay":35.5},"Charge":{"w":40,"h":64,"n":10,"r":8,"d":[2,2,2,2,2,2,2,2,2,2],"ax":20.5,"ay":35.5},"Hurt":{"w":56,"h":72,"n":2,"r":8,"d":[2,8],"ax":27.5,"ay":35.5},"Faint":{"w":56,"h":72,"n":2,"r":8,"d":[2,8],"ax":27.5,"ay":35.5}},"sh":1},"303-mega":{"s":1,"a":{"Idle":{"w":56,"h":56,"n":13,"r":8,"d":[40,2,2,2,4,6,4,6,4,2,2,2,4],"ax":27.5,"ay":31.5},"Walk":{"w":48,"h":56,"n":4,"r":8,"d":[8,10,8,10],"ax":23.5,"ay":31.5},"Attack":{"w":72,"h":96,"n":10,"r":8,"d":[2,6,1,1,1,2,2,2,2,2],"ax":35.5,"ay":50.5},"Shoot":{"w":72,"h":72,"n":15,"r":8,"d":[1,1,1,2,6,1,1,2,2,2,4,2,2,1,1],"ax":35.5,"ay":39.5},"Charge":{"w":56,"h":56,"n":10,"r":8,"d":[2,2,2,2,2,2,2,2,2,2],"ax":28.5,"ay":31.5},"Hurt":{"w":64,"h":64,"n":2,"r":8,"d":[2,8],"ax":31.5,"ay":33.5},"Faint":{"w":40,"h":48,"n":4,"r":8,"d":[8,12,4,10],"ax":19.5,"ay":27.5}},"sh":1},"308-mega":{"s":1,"a":{"Idle":{"w":32,"h":56,"n":6,"r":8,"d":[40,8,8,8,8,8],"ax":15.5,"ay":31.5},"Walk":{"w":32,"h":56,"n":8,"r":8,"d":[6,6,6,6,6,6,6,6],"ax":15.5,"ay":31.5},"Attack":{"w":72,"h":80,"n":11,"r":8,"d":[2,2,4,2,2,2,2,2,2,2,2],"ax":35.5,"ay":43.5},"Shoot":{"w":40,"h":56,"n":10,"r":8,"d":[2,2,2,2,2,2,2,2,2,2],"ax":20.5,"ay":31.5},"Charge":{"w":40,"h":56,"n":10,"r":8,"d":[2,2,2,2,2,2,2,2,2,2],"ax":20.5,"ay":31.5},"Hurt":{"w":48,"h":72,"n":2,"r":8,"d":[2,8],"ax":23.5,"ay":35.5},"Faint":{"w":48,"h":72,"n":2,"r":8,"d":[2,8],"ax":23.5,"ay":35.5}}},"310-mega":{"s":1,"a":{"Idle":{"w":40,"h":56,"n":14,"r":8,"d":[60,10,2,2,2,2,2,2,2,2,2,2,2,10],"ax":19.5,"ay":31.5},"Walk":{"w":40,"h":56,"n":4,"r":8,"d":[8,10,8,10],"ax":19.5,"ay":31.5},"Attack":{"w":72,"h":88,"n":13,"r":8,"d":[2,2,6,2,2,2,2,2,2,2,2,2,2],"ax":35.5,"ay":44.5},"Shoot":{"w":48,"h":64,"n":11,"r":8,"d":[2,6,2,2,2,2,2,2,2,2,2],"ax":23.5,"ay":33.5},"Charge":{"w":40,"h":56,"n":10,"r":8,"d":[2,2,2,2,2,2,2,2,2,2],"ax":20.5,"ay":31.5},"Hurt":{"w":48,"h":64,"n":2,"r":8,"d":[2,8],"ax":23.5,"ay":31.5},"Faint":{"w":48,"h":64,"n":2,"r":8,"d":[2,8],"ax":23.5,"ay":31.5}},"sh":1},"319-mega":{"s":1,"a":{"Idle":{"w":40,"h":48,"n":4,"r":8,"d":[16,16,16,16],"ax":19.5,"ay":27.5},"Walk":{"w":40,"h":56,"n":8,"r":8,"d":[10,8,8,8,10,8,8,8],"ax":19.5,"ay":31.5},"Attack":{"w":80,"h":80,"n":10,"r":8,"d":[2,4,1,1,1,2,2,2,2,2],"ax":39.5,"ay":42.5},"Shoot":{"w":80,"h":80,"n":10,"r":8,"d":[2,4,1,1,1,2,2,2,2,2],"ax":39.5,"ay":42.5},"Charge":{"w":40,"h":48,"n":4,"r":8,"d":[16,16,16,16],"ax":19.5,"ay":27.5},"Hurt":{"w":40,"h":48,"n":4,"r":8,"d":[16,16,16,16],"ax":19.5,"ay":27.5},"Faint":{"w":40,"h":48,"n":4,"r":8,"d":[16,16,16,16],"ax":19.5,"ay":27.5}},"sh":1},"323-mega":{"s":1,"a":{"Idle":{"w":40,"h":48,"n":4,"r":8,"d":[8,20,8,20],"ax":19.5,"ay":27.5},"Walk":{"w":40,"h":48,"n":4,"r":8,"d":[8,10,8,10],"ax":19.5,"ay":27.5},"Attack":{"w":72,"h":80,"n":10,"r":8,"d":[2,6,1,1,1,2,2,2,2,2],"ax":35.5,"ay":42.5},"Shoot":{"w":48,"h":48,"n":11,"r":8,"d":[2,6,2,2,2,2,2,2,2,2,2],"ax":23.5,"ay":25.5},"Charge":{"w":40,"h":48,"n":10,"r":8,"d":[2,2,2,2,2,2,2,2,2,2],"ax":20.5,"ay":27.5},"Hurt":{"w":40,"h":64,"n":2,"r":8,"d":[2,8],"ax":19.5,"ay":33.5},"Faint":{"w":40,"h":64,"n":2,"r":8,"d":[2,8],"ax":19.5,"ay":33.5}},"sh":1},"334-mega":{"s":2,"a":{"Idle":{"w":64,"h":104,"n":8,"r":8,"d":[12,12,12,12,12,12,12,12],"ax":31.5,"ay":55.5},"Walk":{"w":64,"h":104,"n":10,"r":8,"d":[6,6,8,8,6,6,6,8,8,6],"ax":31.5,"ay":55.5},"Attack":{"w":72,"h":128,"n":15,"r":8,"d":[2,2,2,2,2,4,1,1,2,2,2,2,2,2,2],"ax":35.5,"ay":67.5},"Shoot":{"w":80,"h":120,"n":14,"r":8,"d":[2,2,2,2,6,1,1,2,2,2,2,2,2,2],"ax":39.5,"ay":63.5},"Charge":{"w":64,"h":112,"n":10,"r":8,"d":[2,2,2,2,2,2,2,2,2,2],"ax":32.5,"ay":59.5},"Hurt":{"w":72,"h":120,"n":2,"r":8,"d":[2,8],"ax":35.5,"ay":59.5},"Faint":{"w":72,"h":120,"n":2,"r":8,"d":[2,8],"ax":35.5,"ay":59.5}},"sh":1},"354-mega":{"s":1,"a":{"Idle":{"w":32,"h":64,"n":9,"r":8,"d":[50,6,6,6,6,6,6,6,6],"ax":15.5,"ay":35.5},"Walk":{"w":32,"h":64,"n":4,"r":8,"d":[8,10,8,10],"ax":15.5,"ay":35.5},"Attack":{"w":72,"h":80,"n":10,"r":8,"d":[2,4,1,1,1,2,2,2,2,2],"ax":35.5,"ay":42.5},"Shoot":{"w":32,"h":64,"n":10,"r":8,"d":[2,2,2,2,2,2,2,2,2,2],"ax":16.5,"ay":35.5},"Charge":{"w":32,"h":64,"n":10,"r":8,"d":[2,2,2,2,2,2,2,2,2,2],"ax":16.5,"ay":35.5},"Hurt":{"w":56,"h":80,"n":2,"r":8,"d":[2,8],"ax":27.5,"ay":41.5},"Faint":{"w":56,"h":80,"n":2,"r":8,"d":[2,8],"ax":27.5,"ay":41.5}},"sh":1},"359-mega":{"s":1,"a":{"Idle":{"w":40,"h":56,"n":2,"r":8,"d":[30,30],"ax":19.5,"ay":31.5},"Walk":{"w":40,"h":56,"n":4,"r":8,"d":[8,10,8,10],"ax":19.5,"ay":31.5},"Attack":{"w":72,"h":80,"n":10,"r":8,"d":[2,4,1,1,1,2,2,2,2,2],"ax":35.5,"ay":42.5},"Shoot":{"w":72,"h":80,"n":10,"r":8,"d":[2,4,1,1,1,2,2,2,2,2],"ax":35.5,"ay":42.5},"Charge":{"w":40,"h":56,"n":10,"r":8,"d":[2,2,2,2,2,2,2,2,2,2],"ax":20.5,"ay":31.5},"Hurt":{"w":40,"h":56,"n":2,"r":8,"d":[2,8],"ax":19.5,"ay":29.5},"Faint":{"w":40,"h":56,"n":2,"r":8,"d":[2,8],"ax":19.5,"ay":29.5}},"sh":1},"362-mega":{"s":2,"a":{"Idle":{"w":32,"h":72,"n":8,"r":8,"d":[6,6,6,6,6,6,6,6],"ax":15.5,"ay":39.5},"Walk":{"w":32,"h":72,"n":8,"r":8,"d":[6,6,6,6,6,6,6,6],"ax":15.5,"ay":39.5},"Attack":{"w":72,"h":104,"n":10,"r":8,"d":[2,6,1,1,1,2,2,2,2,2],"ax":35.5,"ay":54.5},"Shoot":{"w":48,"h":72,"n":11,"r":8,"d":[2,6,2,2,2,2,2,2,2,2,2],"ax":23.5,"ay":37.5},"Charge":{"w":40,"h":64,"n":10,"r":8,"d":[2,2,2,2,2,2,2,2,2,2],"ax":20.5,"ay":35.5},"Hurt":{"w":48,"h":80,"n":2,"r":8,"d":[2,8],"ax":23.5,"ay":39.5},"Faint":{"w":48,"h":80,"n":2,"r":8,"d":[2,8],"ax":23.5,"ay":39.5}},"sh":1},"380-mega":{"s":2,"a":{"Idle":{"w":72,"h":72,"n":6,"r":8,"d":[8,8,8,8,8,8],"ax":35.5,"ay":39.5},"Walk":{"w":72,"h":72,"n":12,"r":8,"d":[4,4,4,4,4,4,4,4,4,4,4,4],"ax":35.5,"ay":39.5},"Attack":{"w":88,"h":80,"n":11,"r":8,"d":[2,2,6,1,1,1,2,2,2,2,2],"ax":43.5,"ay":42.5},"Shoot":{"w":80,"h":88,"n":12,"r":8,"d":[2,6,1,1,2,2,2,2,2,2,2,2],"ax":39.5,"ay":45.5},"Charge":{"w":80,"h":88,"n":10,"r":8,"d":[2,2,2,2,2,2,2,2,2,2],"ax":40.5,"ay":47.5},"Hurt":{"w":80,"h":96,"n":2,"r":8,"d":[2,8],"ax":39.5,"ay":49.5},"Faint":{"w":80,"h":96,"n":2,"r":8,"d":[2,8],"ax":39.5,"ay":49.5}},"sh":1},"381-mega":{"s":2,"a":{"Idle":{"w":80,"h":80,"n":6,"r":8,"d":[8,8,8,8,8,8],"ax":39.5,"ay":43.5},"Walk":{"w":80,"h":80,"n":12,"r":8,"d":[4,4,4,4,4,4,4,4,4,4,4,4],"ax":39.5,"ay":43.5},"Attack":{"w":96,"h":88,"n":11,"r":8,"d":[2,2,6,1,1,1,2,2,2,2,2],"ax":47.5,"ay":46.5},"Shoot":{"w":88,"h":96,"n":12,"r":8,"d":[2,6,1,1,2,2,2,2,2,2,2,2],"ax":43.5,"ay":49.5},"Charge":{"w":88,"h":88,"n":10,"r":8,"d":[2,2,2,2,2,2,2,2,2,2],"ax":44.5,"ay":47.5},"Hurt":{"w":80,"h":104,"n":2,"r":8,"d":[2,8],"ax":39.5,"ay":53.5},"Faint":{"w":80,"h":104,"n":2,"r":8,"d":[2,8],"ax":39.5,"ay":53.5}},"sh":1},"382-primal":{"s":2,"a":{"Idle":{"w":64,"h":72,"n":10,"r":8,"d":[10,14,14,14,14,10,14,14,14,14],"ax":31.5,"ay":39.5},"Walk":{"w":64,"h":72,"n":10,"r":8,"d":[8,8,8,8,8,8,8,8,8,8],"ax":31.5,"ay":39.5},"Attack":{"w":80,"h":72,"n":10,"r":8,"d":[2,6,1,1,2,2,2,2,2,2],"ax":39.5,"ay":38.5},"Shoot":{"w":72,"h":72,"n":11,"r":8,"d":[2,6,2,2,2,2,2,2,2,2,2],"ax":35.5,"ay":37.5},"Charge":{"w":64,"h":64,"n":10,"r":8,"d":[2,2,2,2,2,2,2,2,2,2],"ax":32.5,"ay":35.5},"Hurt":{"w":64,"h":88,"n":2,"r":8,"d":[2,8],"ax":31.5,"ay":43.5},"Faint":{"w":64,"h":88,"n":2,"r":8,"d":[2,8],"ax":31.5,"ay":43.5}},"sh":1},"383-primal":{"s":2,"a":{"Idle":{"w":72,"h":80,"n":14,"r":8,"d":[60,10,2,2,2,2,2,2,2,2,2,2,2,10],"ax":35.5,"ay":43.5},"Walk":{"w":72,"h":80,"n":4,"r":8,"d":[10,12,10,12],"ax":35.5,"ay":43.5},"Attack":{"w":88,"h":104,"n":10,"r":8,"d":[2,6,1,1,2,2,2,2,2,2],"ax":43.5,"ay":54.5},"Shoot":{"w":80,"h":88,"n":12,"r":8,"d":[2,2,6,2,2,2,2,2,2,2,2,2],"ax":39.5,"ay":45.5},"Charge":{"w":64,"h":80,"n":10,"r":8,"d":[2,2,2,2,2,2,2,2,2,2],"ax":32.5,"ay":43.5},"Hurt":{"w":72,"h":80,"n":2,"r":8,"d":[2,8],"ax":35.5,"ay":39.5},"Faint":{"w":72,"h":80,"n":2,"r":8,"d":[2,8],"ax":35.5,"ay":39.5}},"sh":1},"384-mega":{"s":2,"a":{"Idle":{"w":144,"h":136,"n":10,"r":8,"d":[10,14,14,14,14,10,14,14,14,14],"ax":71.5,"ay":71.5},"Walk":{"w":144,"h":128,"n":4,"r":8,"d":[16,16,16,16],"ax":71.5,"ay":67.5},"Attack":{"w":176,"h":144,"n":10,"r":8,"d":[2,4,1,1,1,2,2,2,2,2],"ax":87.5,"ay":74.5},"Shoot":{"w":120,"h":136,"n":11,"r":8,"d":[2,6,2,2,2,2,2,2,2,2,2],"ax":59.5,"ay":69.5},"Charge":{"w":128,"h":136,"n":10,"r":8,"d":[2,2,2,2,2,2,2,2,2,2],"ax":64.5,"ay":71.5},"Hurt":{"w":104,"h":144,"n":2,"r":8,"d":[2,8],"ax":51.5,"ay":73.5},"Faint":{"w":104,"h":144,"n":2,"r":8,"d":[2,8],"ax":51.5,"ay":73.5}},"sh":1},"428-mega":{"s":1,"a":{"Idle":{"w":40,"h":56,"n":7,"r":8,"d":[20,4,2,4,4,2,6],"ax":19.5,"ay":31.5},"Walk":{"w":40,"h":64,"n":9,"r":8,"d":[6,2,2,4,4,4,4,6,4],"ax":19.5,"ay":33.5},"Attack":{"w":72,"h":80,"n":10,"r":8,"d":[2,2,6,1,2,2,4,4,2,2],"ax":35.5,"ay":41.5},"Shoot":{"w":48,"h":56,"n":12,"r":8,"d":[2,2,6,1,2,2,2,2,2,2,2,2],"ax":23.5,"ay":30.5},"Charge":{"w":40,"h":48,"n":10,"r":8,"d":[2,2,2,2,2,2,2,2,2,2],"ax":20.5,"ay":27.5},"Hurt":{"w":48,"h":56,"n":2,"r":8,"d":[2,8],"ax":23.5,"ay":29.5},"Faint":{"w":48,"h":56,"n":2,"r":8,"d":[2,8],"ax":23.5,"ay":29.5}},"sh":1},"448-mega":{"s":1,"a":{"Idle":{"w":32,"h":48,"n":10,"r":8,"d":[40,2,2,2,2,2,2,2,2,12],"ax":15.5,"ay":27.5},"Walk":{"w":32,"h":48,"n":4,"r":8,"d":[8,10,8,10],"ax":15.5,"ay":27.5},"Attack":{"w":64,"h":80,"n":13,"r":8,"d":[2,2,2,2,1,1,1,1,2,2,2,2,2],"ax":32.5,"ay":41.5},"Shoot":{"w":64,"h":80,"n":13,"r":8,"d":[2,2,2,2,1,1,1,1,2,2,2,2,2],"ax":32.5,"ay":41.5},"Charge":{"w":32,"h":48,"n":10,"r":8,"d":[2,2,2,2,2,2,2,2,2,2],"ax":16.5,"ay":27.5},"Hurt":{"w":40,"h":56,"n":2,"r":8,"d":[2,8],"ax":19.5,"ay":29.5},"Faint":{"w":40,"h":56,"n":2,"r":8,"d":[2,8],"ax":19.5,"ay":29.5}},"sh":1},"475-mega":{"s":1,"a":{"Idle":{"w":24,"h":64,"n":5,"r":8,"d":[60,2,6,2,26],"ax":11.5,"ay":35.5},"Walk":{"w":24,"h":48,"n":4,"r":8,"d":[12,12,12,12],"ax":11.5,"ay":27.5},"Attack":{"w":64,"h":80,"n":13,"r":8,"d":[2,2,6,1,1,1,2,2,2,2,2,1,2],"ax":31.5,"ay":41.5},"Shoot":{"w":40,"h":56,"n":12,"r":8,"d":[2,2,6,1,2,2,2,2,2,2,2,2],"ax":19.5,"ay":30.5},"Charge":{"w":24,"h":56,"n":10,"r":8,"d":[2,2,2,2,2,2,2,2,2,2],"ax":12.5,"ay":31.5},"Hurt":{"w":40,"h":56,"n":2,"r":8,"d":[2,8],"ax":19.5,"ay":29.5},"Faint":{"w":40,"h":56,"n":2,"r":8,"d":[2,8],"ax":19.5,"ay":29.5}},"sh":1},"491-mega":{"s":2,"a":{"Idle":{"w":96,"h":96,"n":11,"r":8,"d":[10,5,10,5,10,5,10,5,10,5,15],"ax":47.5,"ay":51.5},"Walk":{"w":96,"h":96,"n":6,"r":8,"d":[10,10,10,10,10,10],"ax":47.5,"ay":51.5},"Attack":{"w":104,"h":136,"n":10,"r":8,"d":[3,3,2,2,2,2,4,4,4,2],"ax":51.5,"ay":71.5},"Shoot":{"w":96,"h":96,"n":12,"r":8,"d":[3,5,6,3,3,4,4,4,4,4,2,2],"ax":47.5,"ay":49.5},"Charge":{"w":88,"h":80,"n":10,"r":8,"d":[2,2,2,2,2,2,2,2,2,2],"ax":43.5,"ay":43.5},"Hurt":{"w":88,"h":104,"n":2,"r":8,"d":[2,8],"ax":43.5,"ay":53.5},"Faint":{"w":88,"h":104,"n":2,"r":8,"d":[2,8],"ax":43.5,"ay":53.5}}},"530-mega":{"s":2,"a":{"Idle":{"w":72,"h":64,"n":4,"r":8,"d":[48,18,28,24],"ax":35.5,"ay":35.5},"Walk":{"w":64,"h":64,"n":4,"r":8,"d":[10,16,10,16],"ax":31.5,"ay":35.5},"Attack":{"w":120,"h":104,"n":11,"r":8,"d":[2,2,2,6,2,2,2,2,2,2,2],"ax":59.5,"ay":54.5},"Shoot":{"w":80,"h":72,"n":13,"r":8,"d":[2,3,6,1,2,2,2,2,2,2,2,2,2],"ax":39.5,"ay":37.5},"Charge":{"w":72,"h":64,"n":10,"r":8,"d":[2,2,2,2,2,2,2,2,2,2],"ax":36.5,"ay":35.5},"Hurt":{"w":80,"h":64,"n":2,"r":8,"d":[2,8],"ax":39.5,"ay":33.5},"Faint":{"w":80,"h":64,"n":2,"r":8,"d":[2,8],"ax":39.5,"ay":33.5}},"sh":1},"560-mega":{"s":1,"a":{"Idle":{"w":32,"h":48,"n":1,"r":8,"d":[8],"ax":15.5,"ay":27.5},"Walk":{"w":32,"h":48,"n":4,"r":8,"d":[8,10,8,10],"ax":15.5,"ay":27.5},"Attack":{"w":72,"h":96,"n":14,"r":8,"d":[2,2,2,2,4,1,1,2,2,2,2,2,2,2],"ax":35.5,"ay":50.5},"Shoot":{"w":72,"h":96,"n":14,"r":8,"d":[2,2,2,2,4,1,1,2,2,2,2,2,2,2],"ax":35.5,"ay":50.5},"Charge":{"w":32,"h":48,"n":1,"r":8,"d":[8],"ax":15.5,"ay":27.5},"Hurt":{"w":32,"h":48,"n":1,"r":8,"d":[8],"ax":15.5,"ay":27.5},"Faint":{"w":32,"h":48,"n":1,"r":8,"d":[8],"ax":15.5,"ay":27.5}},"sh":1},"604-mega":{"s":2,"a":{"Idle":{"w":80,"h":72,"n":10,"r":8,"d":[10,14,14,14,14,10,14,14,14,14],"ax":39.5,"ay":39.5},"Walk":{"w":80,"h":72,"n":10,"r":8,"d":[8,8,8,8,8,8,8,8,8,8],"ax":39.5,"ay":39.5},"Attack":{"w":88,"h":104,"n":14,"r":8,"d":[2,2,6,1,2,2,2,2,2,2,2,2,2,2],"ax":43.5,"ay":53.5},"Shoot":{"w":88,"h":64,"n":12,"r":8,"d":[2,2,6,1,2,2,2,2,2,2,2,2],"ax":43.5,"ay":34.5},"Charge":{"w":72,"h":64,"n":10,"r":8,"d":[2,2,2,2,2,2,2,2,2,2],"ax":36.5,"ay":35.5},"Hurt":{"w":80,"h":72,"n":2,"r":8,"d":[2,8],"ax":39.5,"ay":37.5},"Faint":{"w":80,"h":72,"n":2,"r":8,"d":[2,8],"ax":39.5,"ay":37.5}},"sh":1},"670-mega":{"s":1,"a":{"Idle":{"w":80,"h":120,"n":18,"r":8,"d":[10,14,14,14,14,10,2,2,2,2,2,2,2,14,14,14,14,14],"ax":39.5,"ay":63.5},"Walk":{"w":80,"h":112,"n":10,"r":8,"d":[8,8,8,8,8,8,8,8,8,8],"ax":39.5,"ay":59.5},"Attack":{"w":128,"h":112,"n":15,"r":8,"d":[2,2,1,3,1,3,2,1,2,2,2,2,2,2,10],"ax":63.5,"ay":58.5},"Shoot":{"w":112,"h":112,"n":13,"r":8,"d":[2,3,4,4,1,1,2,2,2,2,2,2,8],"ax":55.5,"ay":57.5},"Charge":{"w":104,"h":64,"n":10,"r":8,"d":[2,2,2,2,2,2,2,2,2,2],"ax":52.5,"ay":35.5},"Hurt":{"w":88,"h":112,"n":2,"r":8,"d":[2,8],"ax":43.5,"ay":55.5},"Faint":{"w":88,"h":112,"n":2,"r":8,"d":[2,8],"ax":43.5,"ay":55.5}},"sh":1},"691-mega":{"s":1,"a":{"Idle":{"w":48,"h":80,"n":10,"r":8,"d":[10,14,14,14,14,10,14,14,14,14],"ax":23.5,"ay":43.5},"Walk":{"w":56,"h":72,"n":5,"r":8,"d":[10,10,12,10,12],"ax":27.5,"ay":39.5},"Attack":{"w":88,"h":96,"n":10,"r":8,"d":[2,4,1,1,1,2,2,2,2,2],"ax":43.5,"ay":50.5},"Shoot":{"w":56,"h":80,"n":11,"r":8,"d":[2,6,1,2,2,2,2,2,2,2,2],"ax":27.5,"ay":41.5},"Charge":{"w":48,"h":72,"n":10,"r":8,"d":[2,2,2,2,2,2,2,2,2,2],"ax":24.5,"ay":39.5},"Hurt":{"w":56,"h":88,"n":2,"r":8,"d":[2,8],"ax":27.5,"ay":45.5},"Faint":{"w":56,"h":88,"n":2,"r":8,"d":[2,8],"ax":27.5,"ay":45.5}},"sh":1},"718-mega":{"s":2,"a":{"Idle":{"w":120,"h":200,"n":10,"r":8,"d":[10,14,14,14,14,10,14,14,14,14],"ax":59.5,"ay":103.5},"Walk":{"w":120,"h":200,"n":10,"r":8,"d":[8,8,8,8,8,8,8,8,8,8],"ax":59.5,"ay":103.5},"Attack":{"w":160,"h":224,"n":14,"r":8,"d":[2,2,6,1,1,1,2,2,2,2,2,2,2,2],"ax":79.5,"ay":113.5},"Shoot":{"w":128,"h":184,"n":14,"r":8,"d":[2,10,1,2,2,2,2,2,2,2,2,2,2,4],"ax":63.5,"ay":93.5},"Charge":{"w":120,"h":184,"n":10,"r":8,"d":[2,2,2,2,2,2,2,2,2,2],"ax":60.5,"ay":95.5},"Hurt":{"w":120,"h":184,"n":2,"r":8,"d":[2,8],"ax":59.5,"ay":91.5},"Faint":{"w":120,"h":184,"n":2,"r":8,"d":[2,8],"ax":59.5,"ay":91.5}},"sh":1},"719-mega":{"s":1,"a":{"Idle":{"w":64,"h":88,"n":4,"r":8,"d":[16,12,16,12],"ax":31.5,"ay":47.5},"Walk":{"w":56,"h":88,"n":9,"r":8,"d":[4,4,4,4,4,4,4,4,4],"ax":27.5,"ay":47.5},"Attack":{"w":80,"h":104,"n":14,"r":8,"d":[2,2,6,1,1,1,2,2,2,2,2,2,1,2],"ax":39.5,"ay":53.5},"Shoot":{"w":56,"h":88,"n":12,"r":8,"d":[2,2,6,1,2,2,2,2,2,2,2,2],"ax":27.5,"ay":46.5},"Charge":{"w":64,"h":96,"n":10,"r":8,"d":[2,2,2,2,2,2,2,2,2,2],"ax":32.5,"ay":51.5},"Hurt":{"w":48,"h":88,"n":2,"r":8,"d":[2,8],"ax":23.5,"ay":45.5},"Faint":{"w":48,"h":88,"n":2,"r":8,"d":[2,8],"ax":23.5,"ay":45.5}},"sh":1},"780-mega":{"s":2,"a":{"Idle":{"w":64,"h":104,"n":10,"r":8,"d":[10,14,14,14,14,10,14,14,14,14],"ax":31.5,"ay":55.5},"Walk":{"w":64,"h":104,"n":10,"r":8,"d":[8,8,6,6,6,8,8,6,6,6],"ax":31.5,"ay":55.5},"Attack":{"w":120,"h":120,"n":14,"r":8,"d":[2,2,6,1,1,1,2,2,2,2,2,2,2,2],"ax":59.5,"ay":61.5},"Shoot":{"w":88,"h":112,"n":11,"r":8,"d":[2,6,2,2,2,2,2,2,2,2,2],"ax":43.5,"ay":57.5},"Charge":{"w":64,"h":112,"n":10,"r":8,"d":[2,2,2,2,2,2,2,2,2,2],"ax":32.5,"ay":59.5},"Hurt":{"w":80,"h":136,"n":2,"r":8,"d":[2,8],"ax":39.5,"ay":67.5},"Faint":{"w":80,"h":136,"n":2,"r":8,"d":[2,8],"ax":39.5,"ay":67.5}},"sh":1},"807-mega":{"s":1,"a":{"Idle":{"w":48,"h":48,"n":10,"r":8,"d":[40,2,2,2,2,2,2,2,2,12],"ax":23.5,"ay":27.5},"Walk":{"w":48,"h":48,"n":4,"r":8,"d":[6,6,6,6],"ax":23.5,"ay":27.5},"Attack":{"w":64,"h":72,"n":15,"r":8,"d":[2,2,2,2,2,2,2,2,2,2,2,2,2,2,2],"ax":31.5,"ay":38.5},"Shoot":{"w":64,"h":72,"n":15,"r":8,"d":[2,2,2,2,2,2,2,2,2,2,2,2,2,2,2],"ax":31.5,"ay":38.5},"Charge":{"w":48,"h":48,"n":10,"r":8,"d":[2,2,2,2,2,2,2,2,2,2],"ax":24.5,"ay":27.5},"Hurt":{"w":48,"h":56,"n":2,"r":8,"d":[2,8],"ax":23.5,"ay":29.5},"Faint":{"w":48,"h":56,"n":2,"r":8,"d":[2,8],"ax":23.5,"ay":29.5}},"sh":1},"978-mega":{"s":1,"a":{"Idle":{"w":40,"h":48,"n":8,"r":8,"d":[8,8,8,8,8,8,8,8],"ax":19.5,"ay":27.5},"Walk":{"w":40,"h":48,"n":8,"r":8,"d":[6,6,6,6,6,6,6,6],"ax":19.5,"ay":27.5},"Attack":{"w":88,"h":72,"n":10,"r":8,"d":[2,6,1,1,1,2,2,2,2,2],"ax":43.5,"ay":38.5},"Shoot":{"w":48,"h":48,"n":11,"r":8,"d":[2,6,2,2,2,2,2,2,2,2,2],"ax":23.5,"ay":25.5},"Charge":{"w":40,"h":48,"n":10,"r":8,"d":[2,2,2,2,2,2,2,2,2,2],"ax":20.5,"ay":27.5},"Hurt":{"w":48,"h":64,"n":2,"r":8,"d":[2,8],"ax":23.5,"ay":31.5},"Faint":{"w":48,"h":64,"n":2,"r":8,"d":[2,8],"ax":23.5,"ay":31.5}},"sh":1}};
  if (!E?.Net || !E?.Coop || !B?.sprites || !B?.spriteMeta) {
    console.warn('[GardCoopMega] Missing game bridge — not installed');
    return;
  }
  const {Net, Coop} = E;
  const INDEX_FORM = 20;
  const INDEX_SHINY = 21;
  const KNOWN = new Set(Object.keys(FALLBACK_META));
  const bValid = v => typeof v === 'string' && v.length < 48 && /^\d{1,5}-(mega(?:-[xyz])?|primal)$/.test(v);
  const validForm = v => bValid(v) && (KNOWN.has(v) || Boolean(B.spriteMeta[v]));
  // Validates form on the receiver before any image requests are made.
  const normalize = v => validForm(v) ? v : '';
  const state = new WeakMap();
  let lastRemoteChange = '-', received = 0, lastReceive = 0, frameCount = 0, lastFps = 0;
  const debug = new URLSearchParams(location.search).has('coopDebug');

  function localSnapshot(frame) {
    if (!Coop.active || !Array.isArray(frame) || frame.length < INDEX_FORM) return;
    const p = B.game?.player;
    const form = normalize(p?.megaForm);
    frame[INDEX_FORM] = form;
    frame[INDEX_SHINY] = p?.shiny || p?.isShiny || p?.anim?.shiny ? 1 : 0;
  }

  const toHost = Net.toHost;
  const send = Net.send;
  if (typeof toHost !== 'function' || typeof send !== 'function') return;
  Net.toHost = function(packet, ...args) {
    if (packet?.k === 'f' && Array.isArray(packet.p)) localSnapshot(packet.p);
    return toHost.call(this, packet, ...args);
  };
  Net.send = function(uid, packet, ...args) {
    if (packet?.k === 'f' && packet.p && !Array.isArray(packet.p)) {
      // Only modify the local host's entry. Other players' tuples are already relayed.
      const me = Coop.me;
      if (me != null && Object.prototype.hasOwnProperty.call(packet.p, me)) localSnapshot(packet.p[me]);
    }
    return send.call(this, uid, packet, ...args);
  };

  function switchRemoteVisual(p, form, shiny) {
    const prev = state.get(p);
    if (prev && prev.form === form && prev.shiny === shiny) return;
    if (!prev && !form) return;
    // Preserve the original animator so reversions are exact, even for shiny Pokémon.
    const original = prev?.original || { anim:p.anim, form:p.megaForm, bodyH:p.bodyH };
    if (!form) {
      p.anim = original.anim;
      p.megaForm = original.form;
      p.bodyH = original.bodyH;
      state.delete(p);
      lastRemoteChange = 'Reverted '+String(p.uid||p.tag||'partner');
      return;
    }
    try {
      // The base client creates a fresh non-Mega Player for each remote participant.
      // Remote SpriteCollab metadata is not registered by the local Mega UI, so register it here.
      const meta = FALLBACK_META[form] || B.spriteMeta[form];
      if (!meta) return;
      if (!B.spriteMeta[form]) B.spriteMeta[form] = meta;
      const oldAnim = p.anim;
      const scale = Number(original.anim?.scale) || Number(p.scale) || 1;
      const next = new B.sprites.Animator(form, scale, shiny);
      if (oldAnim) {
        // Continue facing the same direction with no jitter on the first frame.
        if (oldAnim.dir != null) next.dir = oldAnim.dir;
        if (oldAnim.cur) next.cur = oldAnim.cur;
      }
      p.anim = next;
      p.megaForm = form;
      state.set(p, {original, form, shiny});
      // Optional: preload sheets without delaying or blocking the frame loop.
      if (typeof B.sprites.preload === 'function') {
        try { B.sprites.preload([form], 2200, shiny); } catch (_) {}
      }
      lastRemoteChange = String(p.uid||p.tag||'partner')+' → '+form+(shiny?' shiny':'');
    } catch (err) {
      console.warn('[GardCoopMega] Failed to render remote form '+form, err);
    }
  }

  function receiveTuple(uid, tuple) {
    // Backward-compatible with unmodified co-op packets.
    if (!Array.isArray(tuple) || tuple.length <= INDEX_FORM) return;
    const mate = Coop.mate(uid);
    if (!mate?.connected || !mate.pl) return;
    const form = normalize(tuple[INDEX_FORM]);
    const shiny = tuple[INDEX_SHINY] === 1 || tuple[INDEX_SHINY] === true;
    // If form is unknown, don't alter any existing native sprite.
    if (tuple[INDEX_FORM] && !form) return;
    switchRemoteVisual(mate.pl, form, shiny);
  }

  const onFrame = (uid,packet) => {
    if (!Coop.active || packet?.k !== 'f') return;
    lastReceive = performance.now();
    received++;
    if (Array.isArray(packet.p)) {
      if (Coop.isHost) receiveTuple(uid, packet.p);
    } else if (packet.p && typeof packet.p === 'object') {
      for (const [who, tuple] of Object.entries(packet.p)) {
        // Host/player yourself is not a puppet on your own client.
        if (String(who) === String(Coop.me)) continue;
        receiveTuple(who, tuple);
      }
    }
  };
  Net.on(onFrame);

  // Debug is strictly opt-in: ?coopDebug=1 . No network traffic or costly loops.
  if (debug) {
    const panel = document.createElement('pre');
    panel.id = 'gard-coop-debug';
    panel.style.cssText = 'position:fixed;right:8px;bottom:8px;z-index:2147483000;pointer-events:none;background:#0e1b24ee;color:#b7fbe3;padding:8px;font:11px/1.35 ui-monospace,monospace;border:1px solid #658;text-align:left;max-width:310px;white-space:pre-wrap;';
    document.body.append(panel);
    let mark = performance.now();
    const frame = () => { frameCount++; requestAnimationFrame(frame); };
    requestAnimationFrame(frame);
    const ticker = setInterval(() => {
      if (!panel.isConnected) { clearInterval(ticker); return; }
      const now = performance.now(); lastFps = Math.round(1000 * frameCount / Math.max(1, now-mark)); frameCount=0; mark=now;
      const peer = Coop.isHost ? (Coop.mates.find(m=>m.connected)?.uid) : Net.hostUid;
      const path = peer ? Net.slow(peer) ? 'relay/slow' : 'direct' : 'not connected';
      panel.textContent = `Gard Co-op Diagnostics\nActive: ${!!Coop.active} · ${Coop.isHost?'HOST':'CLIENT'}\nFPS: ${lastFps}\nLink: ${path}\nFrames in: ${received}/s\nLast data: ${lastReceive ? Math.round((now-lastReceive)/1000)+'s ago' : 'none'}\nMega: ${lastRemoteChange}`;
      received=0;
    }, 1000);
  }

  window.PS_COOP_MEGA_SYNC = Object.freeze({version:1,enabled:true});
  console.info('[GardCoopMega] Co-op Mega/Primal sprite synchronization enabled');
})();

/* PokéSurvivor+ Gard — Co-op Mega/Primal remote FX V2
 * Visual-only replay of teammates' Mega/Primal states using the form synced by
 * mega-coop-sync. Does not trigger gameplay weather, damage, audio, or abilities.
 * Uses the existing co-op player snapshots; sends ZERO additional packets.
 */
(()=>{'use strict';
  const E=window.PS_HOOPA_ENGINE, B=window.PS_MEGA_BRIDGE_V5;
  if (!E?.Coop || !B?.camera || !B?.game) {
    console.warn('[GardCoopFX] Missing co-op / camera bridge'); return;
  }
  const Coop=E.Coop;
  const TAU=Math.PI*2, LIMIT=24, RAD=430;
  const canvas=document.createElement('canvas');
  canvas.id='ps-remote-mega-fx'; canvas.setAttribute('aria-hidden','true');
  canvas.style.cssText='position:fixed;inset:0;display:none;pointer-events:none;z-index:3;image-rendering:pixelated';
  document.body.appendChild(canvas);
  const ctx=canvas.getContext('2d',{alpha:true});
  if(!ctx){canvas.remove();return;}
  const states=new Map();
  let prevTick=0, quality=1;
  const clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x));
  const phase=n=>((Math.sin(n*127.1+82.7)*43758.5453)%1+1)%1;
  const size=()=>{const d=Math.min(1.5,window.devicePixelRatio||1),w=Math.round(innerWidth*d),h=Math.round(innerHeight*d);if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;canvas.style.width=innerWidth+'px';canvas.style.height=innerHeight+'px';}ctx.setTransform(d,0,0,d,0,0);ctx.clearRect(0,0,innerWidth,innerHeight);};
  const colors={fairy:['#ff87d8','#b477ff'],psychic:['#ff8cb8','#d585ff'],fighting:['#ffb24b','#e75b66'],water:['#5deaff','#367aff'],fire:['#ffba56','#ff5c25'],grass:['#95f67c','#42d481'],electric:['#fff17b','#fbb02c'],dragon:['#8bc9ff','#986dff'],ghost:['#bb9dff','#7752a7'],dark:['#9584ce','#715581'],steel:['#c9e1ff','#91c1ff'],normal:['#fbe6b6','#d6b887'],ground:['#fedc8f','#df995c'],rock:['#dfc39f','#a38f77'],ice:['#d5ffff','#70cfff'],poison:['#dd98f2','#9853d3'],bug:['#c6e881','#81ca6a'],flying:['#c7e0ff','#8ca6eb']};
  const validForm=f=>typeof f==='string'&&/^\d{1,5}-(mega(?:-[xyz])?|primal)$/.test(f);
  function inGame(){return Coop.active && B.game.state==='playing' && !document.hidden;}
  function view(){const cam=B.camera,g=document.getElementById('game');if(!cam||!g||typeof cam.left!=='function'||typeof cam.top!=='function')return null;const r=g.getBoundingClientRect(),k=cam.scale*(cam._cw>0?r.width/cam._cw:1);if(!(k>0)||r.width<1||r.height<1)return null;return {r,k,l:cam.left(),t:cam.top()};}
  const xy=(v,x,y)=>({x:v.r.left+(x-v.l)*v.k,y:v.r.top+(y-v.t)*v.k});
  const pulse=(now,f)=>.5+.5*Math.sin(now*f);
  function glow(x,y,r,c0,c1){const g=ctx.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,c0);g.addColorStop(1,c1);ctx.fillStyle=g;ctx.fillRect(x-r,y-r,r*2,r*2);}
  function circle(x,y,r,stroke,a,w=2){ctx.globalAlpha=a;ctx.strokeStyle=stroke;ctx.lineWidth=w;ctx.beginPath();ctx.ellipse(x,y,r,r*.56,0,0,TAU);ctx.stroke();ctx.globalAlpha=1;}
  function drawTransform(x,y,s,now,k,form){const e=(now-s.at)/1000;if(e<0||e>1.3)return;const p=1-e/1.3,col=form.endsWith('primal')?(form.startsWith('382')?'#76faff':'#ff8e3a'):'#fcbaff';
    ctx.save();ctx.globalCompositeOperation='lighter';circle(x,y,Math.max(10,(20+e*150)*k),col,p*.75,Math.max(1.5,5*k*p));
    for(let i=0;i<12;i++){const a=i*TAU/12+phase(i+3)*.25,dist=(14+e*85)*k,px=x+Math.cos(a)*dist,py=y-8*k+Math.sin(a)*dist*.65;
      ctx.fillStyle=i%3===0?'#ffffff':col;ctx.globalAlpha=p*.8;const q=Math.max(1,3*k*p);ctx.fillRect(Math.round(px-q/2),Math.round(py-q/2),q,q);}
    ctx.restore();
  }
  function drawMega(s,pos,v,now){const p=s.p,types=p.mon?.types||p.types||[],type=Array.isArray(types)?types[0]:'fairy',c=colors[type]||['#fab0ff','#b984ff'];const k=v.k,wave=pulse(now,2.7),r=Math.max(24,(Number(p.r)||18)*2)*k;
    ctx.save();ctx.globalCompositeOperation='lighter';
    glow(pos.x,pos.y-18*k,r*2.1,`rgba(235,125,255,${.08+.04*wave})`,'rgba(172,65,255,0)');
    circle(pos.x,pos.y,Math.max(12,r*.7),c[1],.3+.18*wave,Math.max(1,1.8*k));
    for(let j=0;j<(quality?8:4);j++){const a=j*2.399963+now*(j%2?-.53:.47)+phase(j+11)*.6;
      const d=r*(.7+.5*phase(j+4));const xx=pos.x+Math.cos(a)*d, yy=pos.y-15*k+Math.sin(a)*d*.65-5*k*Math.sin(now*3+j);
      ctx.globalAlpha=.34+.24*pulse(now+j,3);ctx.fillStyle=j%2?c[0]:c[1];const z=Math.max(1.2,2.4*k);ctx.fillRect(Math.round(xx),Math.round(yy),z,z);}
    ctx.restore();
  }
  function drawDeltaStream(pos,v,now){
    // Mega Rayquaza: small, localized version of Delta Stream for remote players.
    // The real global wind gameplay and local full-screen scene are not invoked here.
    const k=v.k,reach=180*k;
    ctx.save();ctx.globalCompositeOperation='lighter';
    for(let i=0;i<16;i++){
      const a=(i*TAU/16)+now*(.25+phase(i+17)*.14),rr=(.25+.7*phase(i+21))*reach;
      const x=pos.x+Math.cos(a)*rr,y=pos.y+Math.sin(a)*rr*.58;
      ctx.globalAlpha=.16+.20*pulse(now+i,1.7);ctx.strokeStyle=i%3?'#bcffe2':'#e7ffca';ctx.lineWidth=Math.max(1,1.6*k);
      ctx.beginPath();ctx.moveTo(x-18*k,y+5*k);ctx.lineTo(x+18*k,y-5*k);ctx.stroke();
    }
    ctx.restore();
  }
  function drawPrimal(s,pos,v,now){const form=s.form,sea=form==='382-primal',k=v.k,r=RAD*k;
    ctx.save();ctx.beginPath();ctx.arc(pos.x,pos.y,r,0,TAU);ctx.clip();
    // Localized weather only; Primal Kyogre's own script covers only its local player.
    const g=ctx.createRadialGradient(pos.x,pos.y,r*.08,pos.x,pos.y,r);
    if(sea){g.addColorStop(0,'rgba(30,125,240,0.06)');g.addColorStop(.72,'rgba(20,60,145,0.14)');g.addColorStop(1,'rgba(47,154,255,0.22)');}
    else{g.addColorStop(0,'rgba(255,235,122,0.09)');g.addColorStop(.72,'rgba(255,104,24,0.13)');g.addColorStop(1,'rgba(255,111,35,0.23)');}
    ctx.fillStyle=g;ctx.fillRect(pos.x-r,pos.y-r,r*2,r*2);
    const count=sea?(quality?30:14):(quality?26:12);
    ctx.save();ctx.globalCompositeOperation='lighter';
    for(let i=0;i<count;i++){
      const a=phase(i*7+3)*TAU,rr=Math.sqrt(phase(i*13+7))*RAD*.95*k;
      const bx=pos.x+Math.cos(a)*rr,by=pos.y+Math.sin(a)*rr;
      if(sea){const fall=((now*.7*(.7+phase(i+26)) + phase(i+2))%1),yy=by+(fall-.5)*40*k;
        ctx.strokeStyle='rgba(170,222,255,0.48)';ctx.lineWidth=Math.max(1,k*.9);ctx.beginPath();ctx.moveTo(bx,yy);ctx.lineTo(bx-6*k,yy+12*k);ctx.stroke();
      }else{const asc=((now*.4*(.6+phase(i+14))+phase(i+4))%1),yy=by+(0.5-asc)*55*k;
        const col=i%4===0?'#fff3a4':(i%3===0?'#f77638':'#ffb24a');ctx.globalAlpha=(.15+.6*(1-Math.abs(asc-.5)*2));ctx.fillStyle=col;
        const z=Math.max(1,2.4*k);ctx.fillRect(Math.round(bx),Math.round(yy),z,z);}
    }
    ctx.restore();ctx.restore();
    ctx.save();ctx.globalAlpha=.42+.12*pulse(now,2.8);ctx.strokeStyle=sea?'#6bdafa':'#ffa14d';ctx.lineWidth=Math.max(1.25,2*k);ctx.setLineDash([Math.max(4,12*k),Math.max(4,8*k)]);ctx.lineDashOffset=-now*16;ctx.beginPath();ctx.arc(pos.x,pos.y,r,0,TAU);ctx.stroke();ctx.restore();
    circle(pos.x,pos.y,30*k,sea?'#91e7ff':'#ffaf68',.35+.17*pulse(now,4),Math.max(1.3,2*k));
  }
  function peers(){const result=new Map();const arr=Array.isArray(Coop.mates)?Coop.mates:[];
    for(const m of arr){if(!m?.connected||!m.pl||m.pl.dead||String(m.uid)===String(Coop.me))continue;
      const p=m.pl,f=p.megaForm;if(!validForm(f))continue;
      result.set(String(m.uid),{p,form:f});
    }return result;
  }
  function paint(ts){requestAnimationFrame(paint);if(ts-prevTick<1000/LIMIT)return;const dt=ts-prevTick;prevTick=ts;quality=dt<65?1:0;
    if(!inGame()){if(canvas.style.display!=='none')canvas.style.display='none';states.clear();return;}
    const chars=peers();
    for(const id of states.keys())if(!chars.has(id))states.delete(id);
    if(!chars.size){canvas.style.display='none';return;}
    const v=view();if(!v){canvas.style.display='none';return;}
    size();canvas.style.display='block';const now=ts/1000;
    ctx.save();ctx.beginPath();ctx.rect(v.r.left,v.r.top,v.r.width,v.r.height);ctx.clip();
    for(const [id,{p,form}] of chars){let s=states.get(id);if(!s||s.form!==form){s={form,at:ts,p};states.set(id,s);}else s.p=p;
      if(!Number.isFinite(p.x)||!Number.isFinite(p.y))continue;
      const pos=xy(v,p.x,p.y);const margin=RAD*v.k+40;
      if(pos.x<v.r.left-margin||pos.x>v.r.right+margin||pos.y<v.r.top-margin||pos.y>v.r.bottom+margin)continue;
      if(form.endsWith('primal'))drawPrimal(s,pos,v,now);else {drawMega(s,pos,v,now);if(form==='384-mega')drawDeltaStream(pos,v,now);}
      drawTransform(pos.x,pos.y,s,ts,v.k,form);
    }
    ctx.restore();
  }
  requestAnimationFrame(paint);
  window.PS_COOP_MEGA_FX=Object.freeze({version:2,enabled:true});
  console.info('[GardCoopFX] Remote Mega/Primal visual effects enabled (no added packets)');
})();
