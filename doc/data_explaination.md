Fault code occurrences and anomalies — JSON export

This file gives, day by day, the number of occurrences of each fault code (FC) on each BLS Cargo
TRAXX locomotive (485 series). It also says whether the FC was detected as anomalous that day,
and which group of correlated FCs it belongs to.

File: fc_occurences_<start>_<end>.json (for example fc_occurences_2026-09-08_2026-10-08.json)
Period: from <start> to <end>, both dates included
Source: the PostgreSQL database behind the fault code anomaly dashboard

Format

The file is a JSON list of objects, with one object per (day, locomotive, fault code).
Rows are sorted by date, then locomotive, then fault code.

[
  {
    "date": "2025-09-13",
    "locomotive": "485 001",
    "fault_code": "0FB9",
    "name": "Bog 2 lock for AUX",
    "occurences": 1,
    "is_anomalous": true,
    "correlation_group_id": 86
  },
  ...
]

Field
Type
Description
date
string YYYY-MM-DD
Day
locomotive
string
Locomotive number, for example "485 001"
fault_code
string
Hexadecimal fault code, for example "0FB9"
name
string
Fault code label (in English or German, depending on the manufacturer source)
occurences
int
Number of occurrences of the FC that day, counted only while the locomotive is switched on. The field name is spelled as in the source database.
is_anomalous
bool
true if this FC was considered anomalous on this locomotive that day (see below)
correlation_group_id
int or null
Group of correlated FCs this FC belongs to on this locomotive, null if it is in no group

Which rows are included

Only rows with occurences > 0 are kept, plus anomalous rows even when they have 0 occurrences.
Days with no occurrence and no anomaly are left out: a (day, locomotive, FC) combination missing from
the file means 0 occurrences and no anomaly.

How is_anomalous is computed

Every day, the anomaly detector compares the number of occurrences of an FC on a locomotive with its
historical distribution (a quantile-based method). An anomaly detected on day D covers a date window:

daily anomaly: day D only;
window anomaly ("from YYYY-MM-DD"): every day from YYYY-MM-DD up to and including D.

A row has is_anomalous = true if its date falls inside the window of at least one anomaly for the same
locomotive and the same fault code. A window can start before the beginning of the export: only the days
inside the exported period are flagged.

Correlation groups

A correlation group gathers fault codes that tend to appear together on the same locomotive. The groups
are computed beforehand by the anomaly pipeline.

A group belongs to a single locomotive. The same FC can therefore be in one group on locomotive
485 001 and in another group, or in none, on locomotive 485 003.
On a given locomotive, an FC belongs to at most one group.
Group numbers are the database IDs. They do not match the numbers shown in the dashboard, which
renumbers the groups for each day.

Typical use: when several FCs of the same group are anomalous on the same day, they most likely point to
a single underlying problem rather than several independent ones.

Loading the file

Python / pandas:

import pandas as pd

df = pd.read_json(
    "fc_occurences_2026-09-08_2026-10-08.json",
    dtype={"fault_code": str, "correlation_group_id": "Int64"},
)

anomalies = df[df["is_anomalous"]]

dtype={"fault_code": str} makes sure codes stay text. Without it, on a subset containing only
numeric-looking codes such as "0400", pandas could convert them to numbers.
"Int64" keeps correlation_group_id as an integer despite the null values. Otherwise pandas turns
it into a float.
read_json converts the date column to datetime automatically.