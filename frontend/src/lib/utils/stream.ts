// Stream utilities from OpenNotes

export function splitStream(separator: string = '\n') {
  let buffer = '';

  return new TransformStream({
    transform(chunk: string, controller) {
      buffer += chunk;
      const parts = buffer.split(separator);
      buffer = parts.pop() || '';
      
      for (const part of parts) {
        if (part) {
          controller.enqueue(part);
        }
      }
    },
    flush(controller) {
      if (buffer) {
        controller.enqueue(buffer);
      }
    }
  });
}