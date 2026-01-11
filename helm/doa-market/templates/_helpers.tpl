{{/*
Expand the name of the chart.
*/}}
{{- define "doa-market.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Create a default fully qualified app name.
*/}}
{{- define "doa-market.fullname" -}}
{{- if .Values.fullnameOverride }}
{{- .Values.fullnameOverride | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- $name := default .Chart.Name .Values.nameOverride }}
{{- if contains $name .Release.Name }}
{{- .Release.Name | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- printf "%s-%s" .Release.Name $name | trunc 63 | trimSuffix "-" }}
{{- end }}
{{- end }}
{{- end }}

{{/*
Create chart name and version as used by the chart label.
*/}}
{{- define "doa-market.chart" -}}
{{- printf "%s-%s" .Chart.Name .Chart.Version | replace "+" "_" | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Common labels
*/}}
{{- define "doa-market.labels" -}}
helm.sh/chart: {{ include "doa-market.chart" . }}
{{ include "doa-market.selectorLabels" . }}
{{- if .Chart.AppVersion }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
{{- end }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
environment: {{ .Values.global.environment }}
{{- end }}

{{/*
Selector labels
*/}}
{{- define "doa-market.selectorLabels" -}}
app.kubernetes.io/name: {{ include "doa-market.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }}

{{/*
Service labels
*/}}
{{- define "doa-market.serviceLabels" -}}
app: {{ .serviceName }}
version: {{ .Values.global.imageTag | default "latest" }}
{{- end }}

{{/*
Get image repository
*/}}
{{- define "doa-market.imageRepository" -}}
{{- printf "%s/doa-market-%s" .Values.global.registry .serviceName }}
{{- end }}

{{/*
Get image tag
*/}}
{{- define "doa-market.imageTag" -}}
{{- .Values.services.[.serviceName].image.tag | default .Values.defaults.image.tag | default "latest" }}
{{- end }}
