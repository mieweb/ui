import { describe, it, expect, vi } from 'vitest';
import { screen, fireEvent, act } from '@testing-library/react';
import { renderWithTheme } from '../../test/test-utils';
import {
  SliderCalculator,
  AnimatedNumber,
  type CalculatorInput,
} from './SliderCalculator';

const inputs: CalculatorInput[] = [
  {
    id: 'people',
    label: 'People',
    min: 0,
    max: 100,
    step: 10,
    defaultValue: 50,
  },
  {
    id: 'cost',
    label: 'Cost',
    min: 0,
    max: 200,
    step: 10,
    defaultValue: 100,
    format: 'currency',
  },
];

const compute = ({ people, cost }: Record<string, number>) => ({
  total: people * cost,
  summary: `${people} × ${cost}`,
  breakdown: [
    { label: 'Half', value: (people * cost) / 2 },
    { label: 'Other half', value: (people * cost) / 2 },
  ],
  math: [{ label: 'Formula', value: 'people × cost' }],
});

describe('SliderCalculator', () => {
  it('renders sliders with formatted values and the computed headline', () => {
    renderWithTheme(
      <SliderCalculator inputs={inputs} compute={compute} heading="Calc" />
    );
    expect(screen.getByRole('heading', { name: 'Calc' })).toBeInTheDocument();
    expect(screen.getAllByRole('slider')).toHaveLength(2);
    expect(screen.getByText('$100')).toBeInTheDocument(); // currency-formatted slider value
    expect(screen.getByText('50 × 100')).toBeInTheDocument();
  });

  it('recomputes and fires onChange when a slider moves', () => {
    const onChange = vi.fn();
    renderWithTheme(
      <SliderCalculator inputs={inputs} compute={compute} onChange={onChange} />
    );
    // Slider is a custom role="slider" thumb driven by keyboard; step is 10.
    const thumb = screen.getAllByRole('slider')[0];
    fireEvent.keyDown(thumb, { key: 'ArrowRight' });
    expect(onChange).toHaveBeenCalledWith(
      { people: 60, cost: 100 },
      expect.objectContaining({ total: 6000 })
    );
    expect(screen.getByText('60 × 100')).toBeInTheDocument();
  });

  it('toggles the math disclosure', () => {
    renderWithTheme(<SliderCalculator inputs={inputs} compute={compute} />);
    const toggle = screen.getByRole('button', { name: /Show the math/ });
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByText('people × cost')).toBeNull();
    fireEvent.click(toggle);
    expect(screen.getByText('people × cost')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /Hide the math/ })
    ).toHaveAttribute('aria-expanded', 'true');
  });

  it('renders actions and footnote in the result panel', () => {
    renderWithTheme(
      <SliderCalculator
        inputs={inputs}
        compute={compute}
        actions={<button>Go</button>}
        footnote="Estimate only"
      />
    );
    expect(screen.getByRole('button', { name: 'Go' })).toBeInTheDocument();
    expect(screen.getByText('Estimate only')).toBeInTheDocument();
  });
});

describe('AnimatedNumber', () => {
  it('renders the formatted value', () => {
    renderWithTheme(
      <AnimatedNumber value={1234} format={(v) => `$${Math.round(v)}`} />
    );
    act(() => {});
    expect(screen.getByText(/^\$\d+$/)).toBeInTheDocument();
  });
});
