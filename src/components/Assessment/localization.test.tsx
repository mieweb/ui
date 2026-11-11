import { fireEvent, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { renderWithTheme } from '../../test/test-utils';
import { MessagesProvider } from '../../utils/messages';
import { ProblemList, type ConditionConcern } from '../ProblemList';
import { Assessment } from './Assessment';

const concerns: ConditionConcern[] = [
  {
    concernId: 'hypertension',
    clinicalStatus: 'active',
    assertions: [
      {
        id: 'hypertension-older',
        date: '2025-01-01',
        text: 'High blood pressure',
        verificationStatus: 'provisional',
      },
      {
        id: 'hypertension-current',
        date: '2026-10-10',
        text: 'Essential hypertension',
        verificationStatus: 'provisional',
        changeType: 'refinement',
        coding: [{ system: 'ICD-10-CM', code: 'I10', primary: true }],
        uncertainty: { overall: 'low' },
      },
    ],
  },
  {
    concernId: 'back-pain',
    clinicalStatus: 'active',
    assertions: [
      {
        id: 'back-pain-current',
        date: '2026-10-10',
        text: 'Back pain',
        verificationStatus: 'confirmed',
      },
    ],
  },
];

describe('Shared coded healthcare component localization', () => {
  it('translates order actions and move destinations while retaining native codes and clinical text', () => {
    const onLinkOrder = vi.fn();
    renderWithTheme(
      <MessagesProvider
        messages={{
          labels: {
            Medication: 'Médicament',
            urgent: 'Urgent traduit',
            'Move {name}': 'Déplacer {name}',
            'Move to: {name}': 'Déplacer vers : {name}',
            'Plan for {name}': 'Plan pour {name}',
            'Essential hypertension': 'Do not translate authored diagnoses',
            'Lisinopril 10 mg': 'Do not translate authored medication text',
            I10: 'Do not translate native codes',
          },
        }}
      >
        <Assessment
          concerns={concerns}
          items={concerns.map((concern) => ({
            concernId: concern.concernId,
            assertionId: concern.assertions.at(-1)!.id,
          }))}
          orders={[
            {
              orderId: 'order',
              type: 'medication',
              display: 'Lisinopril 10 mg',
              priority: 'urgent',
              concernId: 'hypertension',
              code: {
                fullid: 'RXNORM/314076',
                codetype: 'RXNORM',
                fullcode: '314076',
              },
            },
          ]}
          onLinkOrder={onLinkOrder}
          renderOrderSearch={false}
        />
      </MessagesProvider>
    );
    expect(screen.getByText('Médicament')).toBeInTheDocument();
    expect(screen.getByText('Urgent traduit')).toBeInTheDocument();
    expect(screen.getByText('Essential hypertension')).toBeInTheDocument();
    expect(screen.getByText('Lisinopril 10 mg')).toBeInTheDocument();
    expect(screen.getByText('(I10)')).toBeInTheDocument();
    fireEvent.click(
      screen.getByRole('button', { name: 'Déplacer Lisinopril 10 mg' })
    );
    fireEvent.click(
      screen.getByRole('menuitem', { name: 'Déplacer vers : Back pain' })
    );
    expect(onLinkOrder).toHaveBeenCalledWith(
      expect.objectContaining({
        orderId: 'order',
        display: 'Lisinopril 10 mg',
        code: {
          fullid: 'RXNORM/314076',
          codetype: 'RXNORM',
          fullcode: '314076',
        },
      }),
      'back-pain'
    );
  });

  it('translates problem status, history and uncertainty labels while leaving recorded assertions intact', () => {
    renderWithTheme(
      <MessagesProvider
        messages={{
          labels: {
            'Problem list': 'Liste des problèmes',
            Active: 'Actif',
            Provisional: 'Provisoire',
            Refined: 'Précisé',
            'Assertion history': 'Historique des assertions',
            '{count} assertions': '{count} versions',
            low: 'faible',
            '{certainty} certainty': 'Certitude {certainty}',
            'Press Enter to toggle history.': 'Entrée ouvre l’historique.',
            'Essential hypertension': 'Do not translate authored diagnoses',
          },
        }}
      >
        <ProblemList concerns={concerns} readOnly />
      </MessagesProvider>
    );
    expect(
      screen.getByRole('heading', { name: 'Liste des problèmes' })
    ).toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'Actif' })).toBeInTheDocument();
    expect(screen.getByText('Provisoire')).toBeInTheDocument();
    expect(screen.getByText('Certitude faible')).toBeInTheDocument();
    expect(screen.getByText('Essential hypertension')).toBeInTheDocument();
    expect(
      screen.getByRole('listitem', {
        name: 'Essential hypertension. Entrée ouvre l’historique.',
      })
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: '2 versions' }));
    expect(
      screen.getByRole('list', { name: 'Historique des assertions' })
    ).toBeInTheDocument();
    expect(screen.getByText('Précisé')).toBeInTheDocument();
    expect(screen.getByText('High blood pressure')).toBeInTheDocument();
    expect(concerns[0].assertions[1].coding![0].code).toBe('I10');
  });
});
