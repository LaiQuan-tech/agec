/**
 * Set an input's value from code in a way React notices.
 *
 * `node.value = x` updates the DOM but not React: React tracks the last value
 * it saw on the node and, seeing no change, swallows the event. FormShell's
 * unsaved-changes guard hangs off the form's `onChange`, so a field written
 * this way would leave the form looking pristine — the user navigates away and
 * the browser never warns them.
 *
 * Going through the prototype's own setter defeats that tracker, and the
 * dispatched `input` event is what React's `onChange` is actually bound to for
 * text inputs.
 *
 * Extracted from Editor.tsx, which needed it first for the two hidden fields
 * holding the editor's HTML and JSON. The upload controls need exactly the same
 * thing, and a second copy of a workaround this obscure is a second copy to get
 * wrong.
 */
export function writeField(node: HTMLInputElement | null, value: string) {
  if (!node || node.value === value) return;

  const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set;
  if (setter) setter.call(node, value);
  else node.value = value;

  node.dispatchEvent(new Event("input", { bubbles: true }));
}
