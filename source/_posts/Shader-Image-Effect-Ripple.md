title: 屏幕水波纹效果
date: 2015-11-06 00:19:06
categories: Shader
tags: 
- Shader 
- Image Effect 
description:
---
前段时间看到了一些很不错的屏幕特效，然后手抖删掉了，幸存几个整理记录一下
这个是屏幕水波纹的效果，可以通过Curve自定义波纹的形状，很是方便
原作者的是随机位置，我加了鼠标点击模式
<!--more-->


### 效果
![](RippleEffect.gif)

### Shader
```
Shader "Hidden/Ripple Effect"
{
    Properties
    {
        _MainTex("Base", 2D) = "white" {}
        _GradTex("Gradient", 2D) = "white" {}
        _Reflection("Reflection Color", Color) = (0, 0, 0, 0)
        _Params1("Parameters 1", Vector) = (1, 1, 0.8, 0)
        _Params2("Parameters 2", Vector) = (1, 1, 1, 0)
        _Drop1("Drop 1", Vector) = (0.49, 0.5, 0, 0)
        _Drop2("Drop 2", Vector) = (0.50, 0.5, 0, 0)
        _Drop3("Drop 3", Vector) = (0.51, 0.5, 0, 0)
    }

    CGINCLUDE

    #include "UnityCG.cginc"

    sampler2D _MainTex;
    float2 _MainTex_TexelSize;

    sampler2D _GradTex;

    half4 _Reflection;
    float4 _Params1;    // [ aspect, 1, scale, 0 ]
    float4 _Params2;    // [ 1, 1/aspect, refraction, reflection ]

    float3 _Drop1;
    float3 _Drop2;
    float3 _Drop3;

    float wave(float2 position, float2 origin, float time)
    {
        float d = length(position - origin);
        float t = time - d * _Params1.z;
        return (tex2D(_GradTex, float2(t, 0)).a - 0.5f) * 2;
    }

    float allwave(float2 position)
    {
        return
            wave(position, _Drop1.xy, _Drop1.z) +
            wave(position, _Drop2.xy, _Drop2.z) +
            wave(position, _Drop3.xy, _Drop3.z);
    }

    half4 frag(v2f_img i) : SV_Target
    {
        const float2 dx = float2(0.01f, 0);
        const float2 dy = float2(0, 0.01f);

        float2 p = i.uv * _Params1.xy;

        float w = allwave(p);
        float2 dw = float2(allwave(p + dx) - w, allwave(p + dy) - w);

        float2 duv = dw * _Params2.xy * 0.2f * _Params2.z;
        half4 c = tex2D(_MainTex, i.uv + duv);
        float fr = pow(length(dw) * 3 * _Params2.w, 3);

        return lerp(c, _Reflection, fr);
    }

    ENDCG

    SubShader
    {
        Pass
        {
            ZTest Always Cull Off ZWrite Off
            Fog { Mode off }
            CGPROGRAM
            #pragma fragmentoption ARB_precision_hint_fastest 
            #pragma target 3.0
            #pragma vertex vert_img
            #pragma fragment frag
            ENDCG
        }
    } 
}

```

### 代码
```csharp
    public enum RippleType
    {
        Auto=0,
        Click
    }

    public RippleType rippleType;

    public AnimationCurve waveform = new AnimationCurve(
        new Keyframe(0.00f, 0.50f, 0, 0),
        new Keyframe(0.05f, 1.00f, 0, 0),
        new Keyframe(0.15f, 0.10f, 0, 0),
        new Keyframe(0.25f, 0.80f, 0, 0),
        new Keyframe(0.35f, 0.30f, 0, 0),
        new Keyframe(0.45f, 0.60f, 0, 0),
        new Keyframe(0.55f, 0.40f, 0, 0),
        new Keyframe(0.65f, 0.55f, 0, 0),
        new Keyframe(0.75f, 0.46f, 0, 0),
        new Keyframe(0.85f, 0.52f, 0, 0),
        new Keyframe(0.99f, 0.50f, 0, 0)
    );

    [Range(0.01f, 1.0f)]
    public float refractionStrength = 0.5f;

    public Color reflectionColor = Color.gray;

    [Range(0.01f, 1.0f)]
    public float reflectionStrength = 0.7f;

    [Range(1.0f, 3.0f)]
    public float waveSpeed = 1.25f;

    [Range(0.0f, 2.0f)]
    public float dropInterval = 0.5f;

    [SerializeField, HideInInspector]
    Shader shader;

    class Droplet
    {
        Vector2 position;
        float time;

        public Droplet()
        {
            time = 1000;
        }


        public void AutoReset(){
            
            position = new Vector2(Random.value, Random.value);
            time = 0;
        }



        public void ClickReset()
        {
            
                position = new Vector2(Input.mousePosition.x / Screen.width,Input.mousePosition.y / Screen.height);

            time = 0;
        }

        public void Update()
        {
            time += Time.deltaTime;
        }

        public Vector4 MakeShaderParameter(float aspect)
        {
            return new Vector4(position.x * aspect, position.y, time, 0);
        }
    }

    Droplet[] droplets;
    Texture2D gradTexture;
    Material material;
    float timer;
    int dropCount;
    int curIndex = 0;
    void UpdateShaderParameters()
    {
        var c = GetComponent<Camera>();

        if (rippleType == RippleType.Auto)
        {
            
            material.SetVector("_Drop1", droplets[0].MakeShaderParameter(c.aspect));
            material.SetVector("_Drop2", droplets[1].MakeShaderParameter(c.aspect));
            material.SetVector("_Drop3", droplets[2].MakeShaderParameter(c.aspect));
            
        }
        else if(rippleType == RippleType.Click)
        {
            material.SetVector("_Drop"+curIndex, droplets[curIndex].MakeShaderParameter(c.aspect));
            curIndex = (++curIndex) % 3;
        }

        material.SetColor("_Reflection", reflectionColor);
        material.SetVector("_Params1", new Vector4(c.aspect, 1, 1 / waveSpeed, 0));
        material.SetVector("_Params2", new Vector4(1, 1 / c.aspect, refractionStrength, reflectionStrength));
    }

    void Awake()
    {
        droplets = new Droplet[3];
        droplets[0] = new Droplet();
        droplets[1] = new Droplet();
        droplets[2] = new Droplet();

        gradTexture = new Texture2D(2048, 1, TextureFormat.Alpha8, false);
        gradTexture.wrapMode = TextureWrapMode.Clamp;
        gradTexture.filterMode = FilterMode.Bilinear;
        for (var i = 0; i < gradTexture.width; i++)
        {
            var x = 1.0f / gradTexture.width * i;
            var a = waveform.Evaluate(x);
            gradTexture.SetPixel(i, 0, new Color(a, a, a, a));
        }
        gradTexture.Apply();

        material = new Material(shader);
        material.hideFlags = HideFlags.DontSave;
        material.SetTexture("_GradTex", gradTexture);
 
    }

    void Update()
    {
        if (dropInterval > 0)
        {
            if (rippleType == RippleType.Auto)
            {
                
                timer += Time.deltaTime;
                while (timer > dropInterval)
                {
                    droplets[dropCount++ % droplets.Length].AutoReset();
                    timer -= dropInterval;
                }
            }
            else if(rippleType == RippleType.Click)
            {
                if (Input.GetMouseButtonDown(0))
                {
                    droplets[dropCount++ % droplets.Length].ClickReset();
                }
            }

        }

        for(int i=0;i<droplets.Length;i++){
            droplets[i].Update();
        }
        

        UpdateShaderParameters();
    }

    void OnRenderImage(RenderTexture source, RenderTexture destination)
    {
        Graphics.Blit(source, destination, material);
    }

```

 