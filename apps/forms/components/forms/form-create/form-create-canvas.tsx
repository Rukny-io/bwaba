'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ApiException } from '@/lib/api-client';
import {
  getForm,
  updateForm,
  updateFormStatus,
  updateFormSteps,
  type FormDetail,
  type FormType,
} from '@/lib/forms-api';
import {
  draftFromApiField,
  fieldsToPayload,
  normalizeFieldOrders,
  type DraftFormField,
} from '@/lib/form-field-utils';
import {
  buildStepsPayload,
  fieldSectionAssignmentFromForm,
  isMultiSectionForm,
  moveFieldBetweenSections,
  sectionsFromForm,
  type FormSectionDraft,
} from '@/lib/form-section-utils';
import { FormCreateBlocksEditor } from '@/components/forms/form-create/blocks/form-create-blocks-editor';
import { FormCreateCustomizePanel } from '@/components/forms/form-create/form-create-customize-panel';
import { FormCreateHeader } from '@/components/forms/form-create/form-create-header';
import { FormCreateSubmitPreview } from '@/components/forms/form-create/form-create-submit-preview';
import {
  FormCreateToolbar,
  type FormSaveStatus,
} from '@/components/forms/form-create/form-create-toolbar';
import { FormCreateWorkspace } from '@/components/forms/form-create/form-create-workspace';
import { FormThemeProvider } from '@/components/forms/theme/form-theme-provider';
import { PublicFormBrand } from '@/components/public-form/public-form-brand';
import { usePlanLimits } from '@/hooks/use-plan-limits';
import { parseFormTheme, type FormTheme } from '@/lib/form-theme';
import { getFormPreviewPath } from '@/lib/forms-paths';
import { appToast } from '@/lib/app-toast';

const SAVE_DEBOUNCE_MS = 800;

function initDraftFields(form: FormDetail): DraftFormField[] {
  if (!form.fields?.length) return [];
  return form.fields
    .map(draftFromApiField)
    .filter((f): f is DraftFormField => f != null)
    .sort((a, b) => a.order - b.order);
}

interface FormCreateCanvasProps {
  form: FormDetail;
  slug: string;
}

export function FormCreateCanvas({ form: initial, slug }: FormCreateCanvasProps) {
  const router = useRouter();
  const { limits } = usePlanLimits();
  const showBranding = !(limits?.removeWatermark ?? false);
  const [title, setTitle] = useState(
    initial.title === 'نموذج جديد' ? '' : initial.title,
  );
  const [type, setType] = useState<FormType>(initial.type);
  const [description, setDescription] = useState(initial.description ?? '');
  const [coverUrl, setCoverUrl] = useState<string | null>(
    initial.coverImage ?? null,
  );
  const [draftFields, setDraftFields] = useState<DraftFormField[]>(() =>
    initDraftFields(initial),
  );
  const [sections, setSections] = useState<FormSectionDraft[]>(() =>
    sectionsFromForm(initial),
  );
  const [fieldAssignment, setFieldAssignment] = useState<Record<string, string>>(
    () => fieldSectionAssignmentFromForm(initial, sectionsFromForm(initial)),
  );
  const [showProgressBar, setShowProgressBar] = useState(
    initial.showProgressBar !== false,
  );
  const [formTheme, setFormTheme] = useState<FormTheme>(() =>
    parseFormTheme(initial.theme),
  );
  const [customizeOpen, setCustomizeOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [saveStatus, setSaveStatus] = useState<FormSaveStatus>('idle');

  const savedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fieldsTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sectionsTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const themeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const draftFieldsRef = useRef(draftFields);
  const sectionsRef = useRef(sections);
  const assignmentRef = useRef(fieldAssignment);
  const showProgressBarRef = useRef(showProgressBar);
  const formThemeRef = useRef(formTheme);

  draftFieldsRef.current = draftFields;
  sectionsRef.current = sections;
  assignmentRef.current = fieldAssignment;
  showProgressBarRef.current = showProgressBar;
  formThemeRef.current = formTheme;

  useEffect(() => {
    if (draftFields.length > 0) return;
    let cancelled = false;
    void getForm(initial.id)
      .then((fresh) => {
        if (cancelled) return;
        const loaded = initDraftFields(fresh);
        if (!loaded.length) return;
        setDraftFields(loaded);
        if (fresh.title && fresh.title !== 'نموذج جديد') {
          setTitle(fresh.title);
        }
        if (fresh.description) setDescription(fresh.description);
        if (fresh.type) setType(fresh.type);
        if (fresh.coverImage) setCoverUrl(fresh.coverImage);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [initial.id, draftFields.length]);

  const flushSavedTimer = useCallback(() => {
    if (savedTimerRef.current) {
      clearTimeout(savedTimerRef.current);
      savedTimerRef.current = null;
    }
  }, []);

  const persist = useCallback(
    async (payload: Parameters<typeof updateForm>[1]) => {
      flushSavedTimer();
      setSaveStatus('saving');
      try {
        const updated = await updateForm(initial.id, payload);
        if (updated.coverImage !== undefined) {
          setCoverUrl(updated.coverImage ?? null);
        }
        // Keep local draftFields as-is after save: clientId is the stable field id
        // sent to the API so submission answers remain linked across edits.
        if (payload.theme !== undefined && updated.theme) {
          setFormTheme(parseFormTheme(updated.theme));
        }
        setSaveStatus('saved');
        savedTimerRef.current = setTimeout(() => setSaveStatus('idle'), 2000);
      } catch {
        setSaveStatus('error');
      }
    },
    [initial.id, flushSavedTimer],
  );

  const scheduleFieldsSave = useCallback(
    (fields: DraftFormField[]) => {
      if (fieldsTimerRef.current) clearTimeout(fieldsTimerRef.current);
      fieldsTimerRef.current = setTimeout(() => {
        void persist({ fields: fieldsToPayload(fields) });
      }, SAVE_DEBOUNCE_MS);
    },
    [persist],
  );

  const scheduleSectionsSave = useCallback(
    (nextSections: FormSectionDraft[], nextAssignment: Record<string, string>) => {
      if (sectionsTimerRef.current) clearTimeout(sectionsTimerRef.current);
      sectionsTimerRef.current = setTimeout(() => {
        void (async () => {
          const fields = draftFieldsRef.current;
          const multi = isMultiSectionForm(nextSections);
          flushSavedTimer();
          setSaveStatus('saving');
          try {
            if (!multi) {
              await updateForm(initial.id, {
                isMultiStep: false,
                showProgressBar: false,
                fields: fieldsToPayload(fields),
              });
            } else {
              await updateForm(initial.id, {
                isMultiStep: true,
                showProgressBar: showProgressBarRef.current,
                fields: fieldsToPayload(fields),
              });
              await updateFormSteps(
                initial.id,
                buildStepsPayload(nextSections, fields, nextAssignment),
              );
            }
            setSaveStatus('saved');
            savedTimerRef.current = setTimeout(() => setSaveStatus('idle'), 2000);
          } catch {
            setSaveStatus('error');
          }
        })();
      }, SAVE_DEBOUNCE_MS);
    },
    [initial.id, flushSavedTimer],
  );

  const saveSectionsNow = useCallback(async () => {
    if (sectionsTimerRef.current) {
      clearTimeout(sectionsTimerRef.current);
      sectionsTimerRef.current = null;
    }
    const nextSections = sectionsRef.current;
    const nextAssignment = assignmentRef.current;
    const fields = draftFieldsRef.current;
    const multi = isMultiSectionForm(nextSections);

    if (!multi) {
      await persist({
        isMultiStep: false,
        showProgressBar: false,
        fields: fieldsToPayload(fields),
      });
      return;
    }

    flushSavedTimer();
    setSaveStatus('saving');
    try {
      await updateForm(initial.id, {
        isMultiStep: true,
        showProgressBar: showProgressBarRef.current,
        fields: fieldsToPayload(fields),
      });
      await updateFormSteps(
        initial.id,
        buildStepsPayload(nextSections, fields, nextAssignment),
      );
      setSaveStatus('saved');
      savedTimerRef.current = setTimeout(() => setSaveStatus('idle'), 2000);
    } catch {
      setSaveStatus('error');
      throw new Error('sections save failed');
    }
  }, [initial.id, persist, flushSavedTimer]);

  const scheduleThemeSave = useCallback(
    (theme: FormTheme) => {
      if (themeTimerRef.current) clearTimeout(themeTimerRef.current);
      themeTimerRef.current = setTimeout(() => {
        void persist({ theme });
      }, SAVE_DEBOUNCE_MS);
    },
    [persist],
  );

  useEffect(() => {
    return () => {
      flushSavedTimer();
      if (fieldsTimerRef.current) clearTimeout(fieldsTimerRef.current);
      if (sectionsTimerRef.current) clearTimeout(sectionsTimerRef.current);
      if (themeTimerRef.current) clearTimeout(themeTimerRef.current);
    };
  }, [flushSavedTimer]);

  function handleFieldsChange(fields: DraftFormField[]) {
    setDraftFields(fields);
    if (isMultiSectionForm(sectionsRef.current)) {
      scheduleSectionsSave(sectionsRef.current, assignmentRef.current);
    } else {
      scheduleFieldsSave(fields);
    }
  }

  function handleSectionsChange(nextSections: FormSectionDraft[]) {
    setSections(nextSections);
    scheduleSectionsSave(nextSections, assignmentRef.current);
  }

  function handleAssignmentChange(nextAssignment: Record<string, string>) {
    setFieldAssignment(nextAssignment);
    scheduleSectionsSave(sectionsRef.current, nextAssignment);
  }

  const handleRemoveField = useCallback(
    (clientId: string) => {
      const currentFields = draftFieldsRef.current;
      const index = currentFields.findIndex((f) => f.clientId === clientId);
      if (index < 0) return;

      const nextAssignment = { ...assignmentRef.current };
      delete nextAssignment[clientId];
      const nextFields = normalizeFieldOrders(
        currentFields.filter((f) => f.clientId !== clientId),
      );

      assignmentRef.current = nextAssignment;
      draftFieldsRef.current = nextFields;
      setFieldAssignment(nextAssignment);
      setDraftFields(nextFields);

      if (fieldsTimerRef.current) clearTimeout(fieldsTimerRef.current);
      if (sectionsTimerRef.current) clearTimeout(sectionsTimerRef.current);

      if (isMultiSectionForm(sectionsRef.current)) {
        void saveSectionsNow();
      } else {
        void persist({ fields: fieldsToPayload(nextFields) });
      }
    },
    [persist, saveSectionsNow],
  );

  const handleMoveField = useCallback(
    (fieldId: string, targetSectionKey: string, targetIndex: number) => {
      const result = moveFieldBetweenSections(
        draftFieldsRef.current,
        sectionsRef.current,
        assignmentRef.current,
        fieldId,
        targetSectionKey,
        targetIndex,
      );
      const nextFields = normalizeFieldOrders(result.fields);
      assignmentRef.current = result.assignment;
      draftFieldsRef.current = nextFields;
      setFieldAssignment(result.assignment);
      setDraftFields(nextFields);

      if (sectionsTimerRef.current) clearTimeout(sectionsTimerRef.current);
      scheduleSectionsSave(sectionsRef.current, result.assignment);
    },
    [scheduleSectionsSave],
  );

  function handleShowProgressBarChange(value: boolean) {
    setShowProgressBar(value);
    showProgressBarRef.current = value;
    if (isMultiSectionForm(sectionsRef.current)) {
      scheduleSectionsSave(sectionsRef.current, assignmentRef.current);
    }
  }

  function handleThemeChange(theme: FormTheme) {
    setFormTheme(theme);
    scheduleThemeSave(theme);
  }

  const saveBasics = useCallback(async () => {
    const trimmedTitle = title.trim() || 'نموذج جديد';
    await updateForm(initial.id, {
      title: trimmedTitle,
      type,
      description: description.trim() || undefined,
    });
  }, [initial.id, title, type, description]);

  const saveFieldsNow = useCallback(async () => {
    if (fieldsTimerRef.current) {
      clearTimeout(fieldsTimerRef.current);
      fieldsTimerRef.current = null;
    }
    await persist({ fields: fieldsToPayload(draftFieldsRef.current) });
  }, [persist]);

  const saveThemeNow = useCallback(async () => {
    if (themeTimerRef.current) {
      clearTimeout(themeTimerRef.current);
      themeTimerRef.current = null;
    }
    await persist({ theme: formThemeRef.current });
  }, [persist]);

  const openFullPreview = useCallback(async () => {
    setError(null);
    setBusy(true);
    try {
      await saveBasics();
      if (draftFieldsRef.current.length > 0) {
        await saveSectionsNow();
      }
      await saveThemeNow();
      window.open(getFormPreviewPath(slug), '_blank', 'noopener,noreferrer');
    } catch (err) {
      setError(
        err instanceof ApiException
          ? err.message
          : 'تعذّر فتح المعاينة — تحقق من الحفظ',
      );
    } finally {
      setBusy(false);
    }
  }, [saveBasics, saveSectionsNow, saveThemeNow, slug]);

  const handlePublish = useCallback(async () => {
    setError(null);

    if (draftFieldsRef.current.length === 0) {
      setError('أضف حقلاً واحداً على الأقل قبل النشر');
      return;
    }

    setBusy(true);
    try {
      await saveBasics();
      await saveSectionsNow();
      await saveThemeNow();
      await updateFormStatus(initial.id, 'PUBLISHED');
      appToast.success('تم نشر النموذج', {
        description: 'يمكنك مشاركة الرابط مع المستجيبين',
      });
      router.push(`/app/forms/${initial.id}`);
    } catch (err) {
      setError(
        err instanceof ApiException
          ? err.message
          : 'تعذّر نشر النموذج',
      );
    } finally {
      setBusy(false);
    }
  }, [saveBasics, saveSectionsNow, saveThemeNow, initial.id, router]);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault();
        void handlePublish();
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [handlePublish]);

  const scrollToSections = useCallback(() => {
    document
      .getElementById('form-sections-anchor')
      ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  return (
    <>
      <FormCreateToolbar
        saveStatus={saveStatus}
        loading={busy}
        fieldCount={draftFields.length}
        sectionCount={sections.length}
        backHref={`/app/forms/${initial.id}`}
        onCustomize={() => setCustomizeOpen(true)}
        onSections={sections.length > 1 ? scrollToSections : undefined}
        onPreview={() => void openFullPreview()}
        onPublish={() => void handlePublish()}
      />

      <FormThemeProvider theme={formTheme} embedded className="flex flex-1 flex-col">
        <FormCreateWorkspace>
        <FormCreateHeader
          formId={initial.id}
          title={title}
          description={description}
          type={type}
          coverUrl={coverUrl}
          onTitleChange={setTitle}
          onDescriptionChange={setDescription}
          onTypeChange={(value) => {
            setType(value);
            void persist({ type: value });
          }}
          onCoverChange={setCoverUrl}
          onTitleBlur={() => {
            const t = title.trim();
            if (t) void persist({ title: t });
          }}
          onDescriptionBlur={() => {
            void persist({
              description: description.trim() || undefined,
            });
          }}
        />

        <div id="form-sections-anchor" className="scroll-mt-28 pt-6 sm:pt-8">
          <FormCreateBlocksEditor
            formId={initial.id}
            submissionCount={
              initial._count?.submissions ?? initial.submissionCount ?? 0
            }
            formType={type}
            fields={draftFields}
            sections={sections}
            assignment={fieldAssignment}
            showProgressBar={showProgressBar}
            onChange={handleFieldsChange}
            onSectionsChange={handleSectionsChange}
            onAssignmentChange={handleAssignmentChange}
            onRemoveField={handleRemoveField}
            onMoveField={handleMoveField}
            onShowProgressBarChange={handleShowProgressBarChange}
          />
        </div>

        <FormCreateSubmitPreview
          theme={formTheme}
          hasFields={draftFields.length > 0}
          onSubmitLabelChange={(submitLabel) =>
            handleThemeChange({ ...formThemeRef.current, submitLabel })
          }
        />

        {error ? (
          <p
            className="mt-6 rounded-3xl bg-[var(--danger)]/10 px-4 py-3 text-sm text-[var(--danger)]"
            role="alert"
          >
            {error}
          </p>
        ) : null}

        {showBranding ? <PublicFormBrand /> : null}
        </FormCreateWorkspace>
      </FormThemeProvider>

      <FormCreateCustomizePanel
        open={customizeOpen}
        onClose={() => setCustomizeOpen(false)}
        theme={formTheme}
        onThemeChange={handleThemeChange}
      />
    </>
  );
}
