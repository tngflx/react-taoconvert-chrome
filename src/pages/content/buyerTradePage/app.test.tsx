import { describe, test } from 'vitest';
import { render, screen } from '@testing-library/react';
//import App from '@pages/app/app';

describe('appTest', () => {
  test('render text', () => {
    // given
    const text = 'content view';

    // when
    //render(<App />);

    // then
    screen.getByText(text);
  });
});
