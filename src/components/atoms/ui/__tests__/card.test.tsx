import { describe, it, expect } from '@jest/globals';
import { render } from '@testing-library/react';
import {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardDescription,
  CardContent,
} from '../card';

describe('Card', () => {
  it('should match snapshot', () => {
    const { container } = render(
      <Card>
        <CardHeader>
          <CardTitle>Card Title</CardTitle>
          <CardDescription>Card description</CardDescription>
        </CardHeader>
        <CardContent>
          <p>Card content</p>
        </CardContent>
        <CardFooter>
          <p>Footer</p>
        </CardFooter>
      </Card>
    );
    expect(container).toMatchSnapshot();
  });

  it('should match snapshot with minimal content', () => {
    const { container } = render(
      <Card>
        <CardContent>
          <p>Simple card</p>
        </CardContent>
      </Card>
    );
    expect(container).toMatchSnapshot();
  });
});
