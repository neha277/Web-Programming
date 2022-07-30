/* The original <http://yann.lecun.com/exdb/mnist/> MNIST docs state:

       The original black and white (bilevel) images from NIST were
       size normalized to fit in a 20x20 pixel box while preserving
       their aspect ratio. The resulting images contain grey levels as
       a result of the anti-aliasing technique used by the
       normalization algorithm. the images were centered in a 28x28
       image by computing the center of mass of the pixels, and
       translating the image so as to position this point at the
       center of the 28x28 field.

    So this application draws the image on a 20x20 canvas, zoomed by a
    factor of 10 using CSS.  The drawn image is regarded as a
    black-and-white bilevel image.  The image is extracted from the
    canvas and anti-aliased using a gaussian filter.  Then the image
    is written on to a 28x28 MNIST grid with its center-of-gravity
    centered on the center of the MNIST grid.

*/

import makeKnnWsClient from './knn-ws-client.mjs';
import canvasToMnistB64 from './canvas-to-mnist-b64.mjs';


//logical size of canvas
const DRAW = { width: 20, height: 20 };

//canvas is zoomed by this factor
const ZOOM = 10;

//color used for drawing digits; this cannot be changed arbitrarily as
//the value selected from each RGBA pixel depends on it being blue.
const FG_COLOR = 'blue';

class DigitImageRecognizer extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    const template = document.querySelector('#recognizer-template');
    this.shadowRoot.appendChild(template.content.cloneNode(true));
    const wsUrl = this.getAttribute('ws-url');
    this.init(wsUrl);
  }

  static get observedAttributes() { return ['ws-url']; }
  attributeChangedCallback(name, _oldValue, newValue) {
    if (name === 'ws-url') {
      this.init(newValue);
    }
  }


  /** Initialize canvas attributes, set up event handlers and attach a
   *  knn web services client for wsUrl to this.  Note that the
   *  environment for the event handlers will have access to this
   *  function's variable via their closures, in particular they will
   *  have access to the canvas, ctx, last and mouseDown variables.
   */
  init(wsUrl) {
    const shadow = this.shadowRoot;  //convenient alias

    const canvas = shadow.querySelector('#img-canvas');
    canvas.width = DRAW.width; canvas.height = DRAW.height;
    canvas.style.width = `${ZOOM * DRAW.width}.px`;
    canvas.style.height = `${ZOOM * DRAW.height}px`;

    const ctx = this.ctx = canvas.getContext("2d");

    // set up ctx attributes sufficient for this project
    ctx.lineJoin = ctx.lineCap = 'round';
    ctx.strokeStyle = FG_COLOR;
    ctx.lineWidth = 1;

    /** set up an event handler for the clear button being clicked */
    const clearButton = shadow.querySelector('#clear');
    clearButton.addEventListener('click', () => {
      this.resetApp(ctx);
    }
    );

    /** set up an event handler for the recognize button being clicked. */
    shadow.querySelector('#recognize').addEventListener('click', () => {
      this.recognize(ctx);
    }
    );

    /** set up an event handler for the pen-width being changed. */
    shadow.querySelector('#pen-width').addEventListener('change', e => {
      ctx.lineWidth = e.target.value;
    }
    );

    /** true if the mouse button is currently pressed within the canvas */
    let mouseDown = false;

    /** the last {x, y} point within the canvas where the mouse was
     *  detected with its button pressed. In logical canvas
     *  coordinates.
     */
    let last = { x: 0, y: 0 };

    /** set up an event handler for the mouse button being pressed within
     *  the canvas.
     */
    canvas.addEventListener('mousedown', (e) => {
      mouseDown = true;
      last = eventCanvasCoord(canvas, e)
    }
    );


    /** set up an event handler for the mouse button being moved within
     *  the canvas.  
     */
    canvas.addEventListener('mousemove', (e) => {
      if (mouseDown) {
        draw(ctx, last, eventCanvasCoord(canvas, e));
        last = eventCanvasCoord(canvas, e);
      }

    }
    );

    /** set up an event handler for the mouse button being released within
     *  the canvas.
     */
    canvas.addEventListener('mouseup', () => {
      mouseDown = false;
    }
    );

    /** set up an event handler for the mouse button being moved off
     *  the canvas.
     */
    canvas.addEventListener('mouseout', () => {
      mouseDown = false;
    }
    );


    /** Create a new KnnWsClient instance in this */
    this.knnWsClient = makeKnnWsClient(wsUrl);

  }

  /** Clear canvas specified by graphics context ctx and any
   *  previously determined label 
   */
  resetApp(ctx) {
    ctx.clearRect(0, 0, DRAW.width, DRAW.height);
    this.shadowRoot.querySelector('#knn-label').innerHTML = '';
    this.shadowRoot.querySelector('#errors').innerHTML = '';
    ctx.lineWidth = 1;
  }

  /** Label the image in the canvas specified by canvas corresponding
   *  to graphics context ctx.  Specifically, call the relevant web
   *  services to label the image.  Display the label in the result
   *  area of the app.  Display any errors encountered.
   */
  async recognize(ctx) {
    const b64 = canvasToMnistB64(ctx);
    const res = await this.knnWsClient.classify(b64);
    if (res.errors) {
      this.reportErrors(res)
    }

    const result = await this.knnWsClient.getImage(res.val.id)
    if (result.errors) {
      this.reportErrors(result)
    }
    this.shadowRoot.querySelector('#knn-label').innerHTML = `${result.val.label}`;

  }

  /** given a result for which hasErrors is true, report all errors 
   *  in the application's error area.
   */
  reportErrors(errResult) {
    const html =
      errResult.errors.map(e => `<li>${e.message}</li>`).join('\n');
    this.shadowRoot.querySelector('#errors').innerHTML = html;
  }


}

/** Draw a line from {x, y} point pt0 to {x, y} point pt1 in ctx */
function draw(ctx, pt0, pt1) {
  ctx.beginPath();
  ctx.moveTo(pt0.x, pt0.y);
  ctx.lineTo(pt1.x, pt1.y);
  ctx.stroke();
}

/** Returns the {x, y} coordinates of event ev relative to canvas in
 *  logical canvas coordinates.
 */
function eventCanvasCoord(canvas, ev) {
  const x = (ev.pageX - canvas.offsetLeft) / ZOOM;
  const y = (ev.pageY - canvas.offsetTop) / ZOOM;
  return { x, y };
}

customElements.define('digit-image-recognizer', DigitImageRecognizer);

