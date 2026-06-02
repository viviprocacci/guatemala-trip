import { useMemo, useState } from "react";
import {
  Clock,
  Compass,
  DollarSign,
  ExternalLink,
  Loader2,
  MapPin,
  Radar,
  Sparkles,
  X,
} from "lucide-react";
import {
  EXCURSION_CATEGORIES,
  EXCURSION_REGIONS,
  EXCURSIONS,
  type Excursion,
  type ExcursionCategory,
} from "../data/excursions";
import { useChatContext } from "../hooks/useChatContext";
import { useAiEnabled } from "../hooks/useAiEnabled";
import { exploreSearch } from "../services/ai";
import type { AiResponse } from "../services/ai";
import { parseExploreResult } from "../../lib/ai/exploreResult";
import type { ExploreAiStructured } from "../../lib/ai/exploreResult";
import type { SearchType } from "../../lib/ai/search";
import { appleMapsUrl, googleMapsDirectionsUrl, openExternal } from "../utils/links";

const TIER_LABEL: Record<Excursion["priceTier"], string> = {
  budget: "Budget",
  moderate: "Mid-range",
  splurge: "Splurge",
};

const SEARCH_TYPES: { id: SearchType; label: string }[] = [
  { id: "general", label: "Everything" },
  { id: "activity", label: "Adventures" },
  { id: "hotel", label: "Stays" },
];

const SEARCH_IDEAS = [
  "Acatenango overnight tour (Ox or Wicho)",
  "Bass fishing on Lake Atitlán",
  "Antigua hostel under $25",
  "Kayak Lake Atitlán early morning",
];

const QUICK_FILTERS = [
  { id: "route", label: "On your trip", icon: Sparkles },
  { id: "budget", label: "Budget", icon: DollarSign },
  { id: "adrenaline", label: "Adrenaline", icon: Compass },
] as const;

type QuickFilter = (typeof QUICK_FILTERS)[number]["id"] | null;

function matchLocal(query: string, type: SearchType): Excursion[] {
  const q = query.toLowerCase().trim();
  if (!q) return [];

  return EXCURSIONS.filter((e) => {
    if (type === "hotel") return false;
    const hay = `${e.name} ${e.tagline} ${e.region} ${e.category} ${e.description}`.toLowerCase();
    return hay.includes(q) || q.split(/\s+/).every((w) => hay.includes(w));
  });
}

function applyBrowseFilters(
  category: ExcursionCategory | "all",
  region: string,
  quick: QuickFilter,
): Excursion[] {
  return EXCURSIONS.filter((e) => {
    if (quick === "route" && !e.onYourRoute) return false;
    if (quick === "budget" && e.priceTier !== "budget") return false;
    if (quick === "adrenaline" && e.category !== "adrenaline") return false;

    if (category !== "all" && e.category !== category) return false;
    if (region === "On your route" && !e.onYourRoute) return false;
    if (region !== "All regions" && region !== "On your route" && e.region !== region) return false;
    return true;
  });
}

export function ExploreView() {
  const [category, setCategory] = useState<ExcursionCategory | "all">("all");
  const [region, setRegion] = useState<string>("All regions");
  const [quickFilter, setQuickFilter] = useState<QuickFilter>(null);
  const [selected, setSelected] = useState<Excursion | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [searchType, setSearchType] = useState<SearchType>("general");
  const [aiStructured, setAiStructured] = useState<ExploreAiStructured | null>(null);
  const [aiMessage, setAiMessage] = useState<string | null>(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchedWeb, setSearchedWeb] = useState(false);
  const [sourcesUsed, setSourcesUsed] = useState<AiResponse["sourcesUsed"]>();
  const [activeSearch, setActiveSearch] = useState<string | null>(null);

  const { context, budget } = useChatContext();
  const { enabled: aiEnabled, exa: exaEnabled } = useAiEnabled();

  const isSearching = activeSearch !== null;

  const filtered = useMemo(() => {
    if (isSearching) return matchLocal(activeSearch, searchType);
    return applyBrowseFilters(category, region, quickFilter);
  }, [category, region, quickFilter, activeSearch, searchType, isSearching]);

  const browseGroups = useMemo(() => {
    if (isSearching) return null;
    const showSplit =
      category === "all" &&
      region === "All regions" &&
      !quickFilter &&
      filtered.some((e) => e.onYourRoute);

    if (!showSplit) return { onRoute: [] as Excursion[], rest: filtered };

    return {
      onRoute: filtered.filter((e) => e.onYourRoute),
      rest: filtered.filter((e) => !e.onYourRoute),
    };
  }, [filtered, category, region, quickFilter, isSearching]);

  const runSearch = async (query: string, type: SearchType = searchType) => {
    const q = query.trim();
    if (!q) return;

    setActiveSearch(q);
    setSearchQuery(q);
    setSearchType(type);
    setAiStructured(null);
    setAiMessage(null);

    if (!aiEnabled) {
      setAiMessage("Curated picks below. Go live with Pedro for real-time prices.");
      return;
    }
    if (!budget.canUse) {
      setAiMessage("Pedro's out of fuel. Clear site data to reset the meter.");
      return;
    }

    setSearchLoading(true);
    try {
      const local = matchLocal(q, type);
      const res = await exploreSearch(
        q,
        type,
        context,
        local.map((e) => `${e.name} (${e.priceLabel})`),
      );
      if (res.costUsd != null || res.usage) {
        budget.recordUsage(
          res.usage ?? { input_tokens: 0, output_tokens: 0 },
          res.costUsd,
        );
      }
      setSearchedWeb(Boolean(res.searchedWeb));
      setSourcesUsed(res.sourcesUsed);
      const structured = res.structured ?? parseExploreResult(res.text);
      if (structured?.items.length) {
        setAiStructured(structured);
      } else {
        setAiMessage("Couldn't read the intel. Try scanning again.");
      }
    } catch (e) {
      setAiMessage(`Scan failed. ${e instanceof Error ? e.message : "Try again."}`);
    } finally {
      setSearchLoading(false);
    }
  };

  const clearSearch = () => {
    setActiveSearch(null);
    setSearchQuery("");
    setAiStructured(null);
    setAiMessage(null);
    setSearchedWeb(false);
    setSourcesUsed(undefined);
  };

  const toggleQuick = (id: QuickFilter) => {
    setQuickFilter((prev) => (prev === id ? null : id));
    if (id === "route") setRegion("All regions");
  };

  return (
    <div className="explore-view">
      <header className="wow-hero explore-hero">
        <div className="wow-hero-top">
          <div>
            <span className="wow-hero-eyebrow">Discover</span>
            <h2 className="wow-hero-title">Explore</h2>
            <p className="wow-hero-sub">
              {EXCURSIONS.length} hand-picked adventures
              {exaEnabled
                ? " · Exa-powered live scan"
                : aiEnabled
                  ? " · Pedro live scan"
                  : ""}
            </p>
          </div>
          <Compass size={28} strokeWidth={1.25} className="wow-hero-icon" aria-hidden />
        </div>

        <form
          className="explore-search-form"
          onSubmit={(e) => {
            e.preventDefault();
            runSearch(searchQuery);
          }}
        >
          <Radar size={17} strokeWidth={1.5} className="explore-search-icon" />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Scan tours, stays, activities…"
            aria-label="Pedro search explore"
          />
          <button
            type="submit"
            className="btn-scan explore-search-btn"
            disabled={searchLoading || !searchQuery.trim()}
          >
            {searchLoading ? <Loader2 size={16} className="spin" /> : "Scan"}
          </button>
        </form>
        {exaEnabled && (
          <p className="explore-powered-by">
            Live discovery search powered by <strong>Exa</strong>
          </p>
        )}
      </header>

      {isSearching ? (
        <section className="explore-panel explore-panel--search">
          <div className="explore-panel-head">
            <div>
              <span className="explore-panel-eyebrow">Live intel</span>
              <h3 className="explore-panel-title">"{activeSearch}"</h3>
            </div>
            <button type="button" className="explore-clear-btn" onClick={clearSearch}>
              <X size={14} /> Clear
            </button>
          </div>

          <div className="explore-search-types">
            {SEARCH_TYPES.map((t) => (
              <button
                key={t.id}
                type="button"
                className={`explore-chip ${searchType === t.id ? "active" : ""}`}
                onClick={() => {
                  setSearchType(t.id);
                  if (activeSearch) runSearch(activeSearch, t.id);
                }}
              >
                {t.label}
              </button>
            ))}
          </div>

          {searchLoading && (
            <div className="explore-scan-loading">
              <Radar size={14} className="spin" />
              {exaEnabled
                ? "Scanning with Exa across the web…"
                : "Scanning live prices across the web…"}
            </div>
          )}

          {aiStructured && (
            <ExploreAiResults
              data={aiStructured}
              query={activeSearch ?? ""}
              searchedWeb={searchedWeb}
              sourcesUsed={sourcesUsed}
            />
          )}

          {aiMessage && !aiStructured && (
            <p className="explore-ai-message">{aiMessage}</p>
          )}

          {filtered.length > 0 && (
            <>
              <p className="explore-section-label">
                From our list · {filtered.length}
              </p>
              <div className="explore-list">
                {filtered.map((exc) => (
                  <ExcursionCard key={exc.id} exc={exc} onOpen={setSelected} />
                ))}
              </div>
            </>
          )}

          {filtered.length === 0 && !searchLoading && aiStructured && (
            <p className="explore-empty">No curated matches for this search.</p>
          )}
        </section>
      ) : (
        <>
          <section className="explore-panel explore-panel--ideas">
            <span className="explore-panel-eyebrow">Quick scans</span>
            <div className="explore-ideas">
              {SEARCH_IDEAS.map((idea) => (
                <button
                  key={idea}
                  type="button"
                  className="explore-idea-btn"
                  onClick={() => runSearch(idea)}
                >
                  {idea}
                </button>
              ))}
            </div>
          </section>

          <section className="explore-panel explore-panel--filters">
            <span className="explore-panel-eyebrow">Browse</span>

            <div className="explore-quick-row">
              {QUICK_FILTERS.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  type="button"
                  className={`explore-quick-btn ${quickFilter === id ? "active" : ""}`}
                  onClick={() => toggleQuick(id)}
                >
                  <Icon size={13} />
                  {label}
                </button>
              ))}
            </div>

            <div className="explore-chip-row">
              {EXCURSION_CATEGORIES.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  className={`explore-chip ${category === c.id ? "active" : ""}`}
                  onClick={() => setCategory(c.id)}
                >
                  {c.label}
                </button>
              ))}
            </div>

            <div className="explore-chip-row explore-chip-row--muted">
              {EXCURSION_REGIONS.map((r) => (
                <button
                  key={r}
                  type="button"
                  className={`explore-chip explore-chip--sm ${region === r ? "active" : ""}`}
                  onClick={() => {
                    setRegion(r);
                    if (r === "On your route") setQuickFilter(null);
                  }}
                >
                  {r}
                </button>
              ))}
            </div>
          </section>

          <section className="explore-panel explore-panel--list">
            {browseGroups && browseGroups.onRoute.length > 0 && (
              <>
                <p className="explore-section-label">
                  <Sparkles size={11} /> On your trip · {browseGroups.onRoute.length}
                </p>
                <div className="explore-list">
                  {browseGroups.onRoute.map((exc) => (
                    <ExcursionCard key={exc.id} exc={exc} onOpen={setSelected} />
                  ))}
                </div>
              </>
            )}

            {browseGroups && browseGroups.rest.length > 0 && (
              <>
                <p className="explore-section-label">
                  {browseGroups.onRoute.length > 0 ? "More to explore" : "All picks"} ·{" "}
                  {browseGroups.rest.length}
                </p>
                <div className="explore-list">
                  {browseGroups.rest.map((exc) => (
                    <ExcursionCard key={exc.id} exc={exc} onOpen={setSelected} />
                  ))}
                </div>
              </>
            )}

            {filtered.length === 0 && (
              <p className="explore-empty">No matches. Try another filter.</p>
            )}
          </section>
        </>
      )}

      {selected && (
        <ExploreModal exc={selected} onClose={() => setSelected(null)} />
      )}
    </div>
  );
}

function ExcursionCard({
  exc,
  onOpen,
}: {
  exc: Excursion;
  onOpen: (exc: Excursion) => void;
}) {
  return (
    <button type="button" className="explore-card" onClick={() => onOpen(exc)}>
      <div className="explore-card-top">
        <span className={`price-tier price-tier--${exc.priceTier}`}>
          {TIER_LABEL[exc.priceTier]}
        </span>
        {exc.onYourRoute && (
          <span className="on-route-badge">
            <Sparkles size={10} /> On your trip
          </span>
        )}
      </div>
      <h3>{exc.name}</h3>
      <p className="explore-tagline">{exc.tagline}</p>
      <div className="explore-card-meta">
        <span>
          <MapPin size={12} /> {exc.region}
        </span>
        <span>
          <DollarSign size={12} /> {exc.priceLabel}
        </span>
        <span>
          <Clock size={12} /> {exc.duration}
        </span>
      </div>
    </button>
  );
}

function ExploreAiResults({
  data,
  query,
  searchedWeb,
  sourcesUsed,
}: {
  data: ExploreAiStructured;
  query: string;
  searchedWeb: boolean;
  sourcesUsed?: AiResponse["sourcesUsed"];
}) {
  let lastGroup: string | undefined;

  return (
    <div className="explore-ai-block">
      <div className="explore-ai-result-head">
        <strong>{data.title || `Results for "${query}"`}</strong>
        <div className="provider-badges">
          {sourcesUsed?.expedia && <span className="intel-badge">Expedia</span>}
          {sourcesUsed?.booking && <span className="intel-badge">Booking</span>}
          {sourcesUsed?.exa && <span className="intel-badge"><Radar size={10} /> Exa</span>}
          {searchedWeb && !sourcesUsed && (
            <span className="intel-badge"><Radar size={10} /> Live intel</span>
          )}
        </div>
      </div>

      {data.intro && <p className="explore-ai-intro">{data.intro}</p>}

      <div className="explore-ai-cards">
        {data.items.map((item, i) => {
          const showGroup = item.group && item.group !== lastGroup;
          if (showGroup) lastGroup = item.group;

          return (
            <div key={`${item.name}-${i}`} className="explore-ai-card-wrap">
              {showGroup && <p className="explore-ai-group-label">{item.group}</p>}
              <article className="explore-ai-card">
                <div className="explore-card-top">
                  <span className="price-tier price-tier--moderate">{item.price}</span>
                  {item.highlight && (
                    <span className="on-route-badge">
                      <Sparkles size={10} /> {item.highlight}
                    </span>
                  )}
                </div>
                <h3>{item.name}</h3>
                <p className="explore-ai-card-why">{item.why}</p>
                {(item.links?.length || item.book) && (
                  <div className="explore-ai-card-book">
                    <span className="explore-ai-book-label">Book</span>
                    {item.links?.length ? (
                      <div className="explore-ai-links">
                        {item.links.map((link) => (
                          <button
                            key={link.url}
                            type="button"
                            className="explore-ai-link-btn"
                            onClick={() => openExternal(link.url)}
                          >
                            {link.label}
                            <ExternalLink size={12} />
                          </button>
                        ))}
                      </div>
                    ) : (
                      <p className="explore-ai-book-text">{item.book}</p>
                    )}
                  </div>
                )}
              </article>
            </div>
          );
        })}
      </div>

      {data.footer && <p className="explore-ai-footer">{data.footer}</p>}
    </div>
  );
}

function ExploreModal({
  exc,
  onClose,
}: {
  exc: Excursion;
  onClose: () => void;
}) {
  return (
    <div className="explore-modal" role="dialog" aria-modal="true">
      <div className="explore-modal-inner">
        <button type="button" className="wallet-modal-close" onClick={onClose} aria-label="Close">
          <X size={22} />
        </button>
        <div className="explore-modal-badges">
          <span className={`price-tier price-tier--${exc.priceTier}`}>
            {TIER_LABEL[exc.priceTier]} · {exc.priceLabel}
          </span>
          {exc.onYourRoute && (
            <span className="on-route-badge">
              <Sparkles size={10} /> On your trip
            </span>
          )}
        </div>
        <h2 className="explore-modal-title">{exc.name}</h2>
        <p className="explore-modal-tagline">{exc.tagline}</p>
        <p className="explore-modal-desc">{exc.description}</p>
        <div className="explore-why-cheap">
          <strong>Why it's worth it</strong>
          <p>{exc.whyCheap}</p>
        </div>
        <ul className="explore-tips">
          {exc.tips.map((t) => (
            <li key={t}>{t}</li>
          ))}
        </ul>
        <div className="explore-modal-actions">
          {exc.lat != null && exc.lng != null && (
            <>
              <button
                type="button"
                className="ride-btn"
                onClick={() =>
                  openExternal(appleMapsUrl({ name: exc.name, lat: exc.lat!, lng: exc.lng! }))
                }
              >
                Maps
              </button>
              <button
                type="button"
                className="ride-btn ride-btn--alt"
                onClick={() =>
                  openExternal(
                    googleMapsDirectionsUrl({ name: exc.name, lat: exc.lat!, lng: exc.lng! }),
                  )
                }
              >
                Directions
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
