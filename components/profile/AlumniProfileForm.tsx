"use client";

import { useState, type FormEvent } from "react";
import { saveAlumniProfile } from "@/lib/firestore/alumniProfiles";
import type { AlumniProfile } from "@/types";

interface AlumniProfileFormProps {
  uid: string;
  defaultName: string;
  existing: AlumniProfile | null;
  onSaved: (profile: AlumniProfile) => void;
  onCancel?: () => void;
}

const CURRENT_YEAR = new Date().getFullYear();

export default function AlumniProfileForm({
  uid,
  defaultName,
  existing,
  onSaved,
  onCancel,
}: AlumniProfileFormProps) {
  const [fullName, setFullName] = useState(existing?.fullName ?? defaultName);
  const [photoUrl, setPhotoUrl] = useState(existing?.photoUrl ?? "");
  const [department, setDepartment] = useState(existing?.department ?? "");
  const [graduationYear, setGraduationYear] = useState(
    existing?.graduationYear?.toString() ?? CURRENT_YEAR.toString()
  );
  const [degree, setDegree] = useState(existing?.degree ?? "");
  const [currentCompany, setCurrentCompany] = useState(existing?.currentCompany ?? "");
  const [jobTitle, setJobTitle] = useState(existing?.jobTitle ?? "");
  const [location, setLocation] = useState(existing?.location ?? "");
  const [skillsText, setSkillsText] = useState(existing?.skills?.join(", ") ?? "");
  const [linkedinUrl, setLinkedinUrl] = useState(existing?.linkedinUrl ?? "");
  const [bio, setBio] = useState(existing?.bio ?? "");
  const [availableForMentorship, setAvailableForMentorship] = useState(
    existing?.availableForMentorship ?? true
  );

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    const year = parseInt(graduationYear, 10);
    if (!fullName.trim()) {
      setError("Full name is required.");
      return;
    }
    if (!year || year < 1950 || year > CURRENT_YEAR + 10) {
      setError("Enter a valid graduation year.");
      return;
    }

    setSubmitting(true);
    try {
      const skills = skillsText
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

      const input = {
        fullName: fullName.trim(),
        photoUrl: photoUrl.trim(),
        department: department.trim(),
        graduationYear: year,
        degree: degree.trim(),
        currentCompany: currentCompany.trim(),
        jobTitle: jobTitle.trim(),
        location: location.trim(),
        skills,
        linkedinUrl: linkedinUrl.trim(),
        bio: bio.trim(),
        availableForMentorship,
      };

      await saveAlumniProfile(uid, input);

      onSaved({
        ...input,
        userId: uid,
        createdAt: existing?.createdAt ?? Date.now(),
        updatedAt: Date.now(),
      });
    } catch {
      setError("Something went wrong saving your profile. Please try again.");
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div>
          <label className="field-label" htmlFor="fullName">Full name</label>
          <input
            id="fullName"
            className="input-field"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="field-label" htmlFor="photoUrl">Profile photo URL</label>
          <input
            id="photoUrl"
            className="input-field"
            value={photoUrl}
            onChange={(e) => setPhotoUrl(e.target.value)}
            placeholder="https://…"
          />
        </div>
        <div>
          <label className="field-label" htmlFor="department">Department</label>
          <input
            id="department"
            className="input-field"
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            placeholder="Computer Science"
          />
        </div>
        <div>
          <label className="field-label" htmlFor="degree">Degree</label>
          <input
            id="degree"
            className="input-field"
            value={degree}
            onChange={(e) => setDegree(e.target.value)}
            placeholder="B.S. Computer Science"
          />
        </div>
        <div>
          <label className="field-label" htmlFor="graduationYear">Graduation year</label>
          <input
            id="graduationYear"
            type="number"
            className="input-field"
            value={graduationYear}
            onChange={(e) => setGraduationYear(e.target.value)}
            min={1950}
            max={CURRENT_YEAR + 10}
            required
          />
        </div>
        <div>
          <label className="field-label" htmlFor="location">Location</label>
          <input
            id="location"
            className="input-field"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Austin, TX"
          />
        </div>
        <div>
          <label className="field-label" htmlFor="currentCompany">Current company</label>
          <input
            id="currentCompany"
            className="input-field"
            value={currentCompany}
            onChange={(e) => setCurrentCompany(e.target.value)}
            placeholder="Nimbus Systems"
          />
        </div>
        <div>
          <label className="field-label" htmlFor="jobTitle">Job title</label>
          <input
            id="jobTitle"
            className="input-field"
            value={jobTitle}
            onChange={(e) => setJobTitle(e.target.value)}
            placeholder="Senior Software Engineer"
          />
        </div>
      </div>

      <div>
        <label className="field-label" htmlFor="skills">Skills</label>
        <input
          id="skills"
          className="input-field"
          value={skillsText}
          onChange={(e) => setSkillsText(e.target.value)}
          placeholder="Python, Product Strategy, Public Speaking"
        />
        <p className="mt-1 font-body text-xs text-ink-400">Separate skills with commas.</p>
      </div>

      <div>
        <label className="field-label" htmlFor="linkedinUrl">LinkedIn URL</label>
        <input
          id="linkedinUrl"
          type="url"
          className="input-field"
          value={linkedinUrl}
          onChange={(e) => setLinkedinUrl(e.target.value)}
          placeholder="https://linkedin.com/in/…"
        />
      </div>

      <div>
        <label className="field-label" htmlFor="bio">Short biography</label>
        <textarea
          id="bio"
          className="input-field min-h-[100px] resize-y"
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          maxLength={600}
          placeholder="A couple of sentences about your path since graduating."
        />
      </div>

      <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-ink/15 px-4 py-3">
        <input
          type="checkbox"
          checked={availableForMentorship}
          onChange={(e) => setAvailableForMentorship(e.target.checked)}
          className="mt-0.5 h-4 w-4 accent-brass"
        />
        <span>
          <span className="block font-body text-sm font-medium text-ink">
            Available for mentorship
          </span>
          <span className="block font-body text-xs text-ink-400">
            Students and faculty can send you mentorship requests when this is on.
          </span>
        </span>
      </label>

      {error && (
        <p className="rounded-lg bg-rust/10 px-3 py-2 font-body text-sm text-rust">{error}</p>
      )}

      <div className="flex items-center gap-3">
        <button type="submit" disabled={submitting} className="btn-primary">
          {submitting ? "Saving…" : "Save profile"}
        </button>
        {onCancel && (
          <button type="button" onClick={onCancel} className="btn-secondary">
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
