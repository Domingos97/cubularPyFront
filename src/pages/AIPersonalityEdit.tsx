import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from '@/components/ui/card';
import { Edit, Save, ArrowLeft } from 'lucide-react';
import { useTranslation } from '@/resources/i18n';

const AIPersonalityEdit = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    system_prompt: '',
    suggestions_prompt: '',
    model_override: '',
    temperature_override: '',
    is_active: true
  });

  useEffect(() => {
    if (id) {
      setIsLoading(true);
      fetch(`http://localhost:3000/api/personalities/${id}`)
        .then(res => res.json())
        .then(data => {
          setFormData({
            name: data.name || '',
            description: data.description || '',
            system_prompt: data.system_prompt || '',
            suggestions_prompt: data.suggestions_prompt || '',
            model_override: data.model_override || '',
            temperature_override: data.temperature_override?.toString() || '',
            is_active: data.is_active ?? true
          });
          setIsLoading(false);
        })
        .catch(() => setIsLoading(false));
    }
  }, [id]);

  const handleSave = async () => {
    setIsLoading(true);
    const payload = {
      ...formData,
      temperature_override: formData.temperature_override ? parseFloat(formData.temperature_override) : null
    };
    try {
      const url = id ? `http://localhost:3000/api/personalities/${id}` : 'http://localhost:3000/api/personalities';
      const method = id ? 'PUT' : 'POST';
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!response.ok) throw new Error('Failed to save');
      toast.success(t('personality.saveSuccess'));
      navigate('/admin');
    } catch (error) {
      toast.error(t('personality.saveError'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-0">
      <div className="w-full flex flex-col gap-8">
        <div className="flex items-center gap-4 px-8 pt-8">
          <Button variant="ghost" size="icon" onClick={() => navigate('/admin')} className="text-gray-400 hover:text-white">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-3xl font-bold text-white">{id ? t('personality.editTitle') : t('personality.createTitle')}</h1>
        </div>

        {/* Info Card */}
        <Card className="bg-gray-800/80 border-gray-700 w-full rounded-none">
          <CardHeader className="px-8 pt-8">
            <CardTitle className="text-white text-xl flex items-center gap-2">
              <Edit className="w-5 h-5 text-blue-400" />
              <Input id="name" value={formData.name} onChange={e => setFormData(f => ({ ...f, name: e.target.value }))} placeholder={t('personality.name')} className="bg-gray-700 border-gray-600 text-white text-lg font-bold" />
            </CardTitle>
            <CardDescription className="text-gray-400">
              <Input id="description" value={formData.description} onChange={e => setFormData(f => ({ ...f, description: e.target.value }))} placeholder={t('personality.description')} className="bg-gray-700 border-gray-600 text-white" />
            </CardDescription>
          </CardHeader>
          <CardContent className="px-8 pb-8">
            <div className="flex items-center gap-6 mt-2">
              <div className="flex items-center gap-2">
                <Switch id="is_active" checked={formData.is_active} onCheckedChange={checked => setFormData(f => ({ ...f, is_active: checked }))} />
                <Label htmlFor="is_active" className="font-medium text-gray-300">{t('personality.active')}</Label>
              </div>
              <div className="flex items-center gap-2">
                <Label htmlFor="model_override" className="text-gray-300">{t('personality.model')}:</Label>
                <Select value={formData.model_override || 'default'} onValueChange={value => setFormData(f => ({ ...f, model_override: value === 'default' ? '' : value }))}>
                  <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                    <SelectValue placeholder="Select model (optional)" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-700 border-gray-600">
                    <SelectItem value="default">Default</SelectItem>
                    <SelectItem value="gpt-5-2025-08-07">GPT-5</SelectItem>
                    <SelectItem value="gpt-5-mini-2025-08-07">GPT-5 Mini</SelectItem>
                    <SelectItem value="gpt-4.1-2025-04-14">GPT-4.1</SelectItem>
                    <SelectItem value="gpt-4o-mini">GPT-4o Mini</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <Label htmlFor="temperature_override" className="text-gray-300">{t('personality.temperature')}:</Label>
                <Input id="temperature_override" type="number" min="0" max="2" step="0.1" value={formData.temperature_override} onChange={e => setFormData(f => ({ ...f, temperature_override: e.target.value }))} placeholder="0.0 - 2.0" className="bg-gray-700 border-gray-600 text-white w-24" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Prompts Card */}
        <Card className="bg-gray-800/80 border-gray-700 w-full rounded-none">
          <CardHeader className="px-8 pt-8">
            <CardTitle className="text-white text-lg">{t('personality.prompts')}</CardTitle>
            <CardDescription className="text-gray-400">{t('personality.promptsDescription')}</CardDescription>
          </CardHeader>
          <CardContent className="px-8 pb-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
              <div className="space-y-2">
                <Label htmlFor="system_prompt" className="text-gray-300">{t('personality.systemPrompt')}</Label>
                <Textarea id="system_prompt" value={formData.system_prompt} onChange={e => setFormData(f => ({ ...f, system_prompt: e.target.value }))} rows={18} className="bg-gray-700 border-gray-600 text-white min-h-[350px] text-base w-full" placeholder={t('personality.systemPromptPlaceholder')} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="suggestions_prompt" className="text-gray-300">{t('personality.suggestions')}</Label>
                <Textarea id="suggestions_prompt" value={formData.suggestions_prompt} onChange={e => setFormData(f => ({ ...f, suggestions_prompt: e.target.value }))} rows={18} className="bg-gray-700 border-gray-600 text-white min-h-[350px] text-base w-full" placeholder={t('personality.suggestionsPlaceholder')} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex gap-3 justify-end px-8 pb-8">
          <Button variant="outline" size="lg" onClick={() => navigate('/admin')} className="border-gray-600 text-gray-300 hover:bg-gray-800">
            {t('personality.cancel')}
          </Button>
          <Button size="lg" onClick={handleSave} loading={isLoading} className="bg-blue-600 text-white hover:bg-blue-700 flex items-center gap-2">
            <Save className="w-5 h-5" />
            {id ? t('personality.update') : t('personality.create')}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AIPersonalityEdit;
